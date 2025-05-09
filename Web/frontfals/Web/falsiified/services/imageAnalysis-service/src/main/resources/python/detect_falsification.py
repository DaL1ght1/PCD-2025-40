import argparse
import json
import torch
import torch.nn as nn
import numpy as np
import sys
from pathlib import Path
from PIL import Image, UnidentifiedImageError
import logging
import timm
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from albumentations.pytorch import ToTensorV2
import albumentations as A
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
import lime
from lime import lime_image
from skimage.segmentation import mark_boundaries
import shap
import os
import random

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

class CustomModel(nn.Module):
    def __init__(self, model_name, dense_units, dropout, pretrained=True, unfreeze_layers=0):
        super(CustomModel, self).__init__()
        self.model_name = model_name
        self.base_model = None
        reported_features = 0

        logging.debug(
            f"Initializing CustomModel: Base='{model_name}', DenseUnits={dense_units}, Dropout={dropout:.2f}, Unfreeze={unfreeze_layers}")

        try:
            if model_name == "ViT_Base":
                from transformers import ViTModel
                hf_model_name = 'google/vit-base-patch16-224'
                self.base_model = ViTModel.from_pretrained(
                    hf_model_name,
                    add_pooling_layer=False,
                )
                reported_features = self.base_model.config.hidden_size
            else:
                timm_model_name_map = {
                    "MobileNetV3_Large": "mobilenetv3_large_100.miil_in21k_ft_in1k",
                    # Add other models as needed
                }
                if model_name not in timm_model_name_map:
                    raise ValueError(f"Model name '{model_name}' not found in timm map or not supported.")
                timm_name = timm_model_name_map[model_name]
                self.base_model = timm.create_model(timm_name, pretrained=pretrained, num_classes=0)
                reported_features = self.base_model.num_features

            try:
                self.base_model.eval()
                with torch.no_grad():
                    dummy_input = torch.zeros(1, 3, 224, 224)
                    if model_name == "ViT_Base":
                        actual_features = self.base_model(dummy_input).last_hidden_state[:, 0]
                    else:
                        actual_features = self.base_model(dummy_input)
                    num_features = actual_features.shape[1]
                    if num_features != reported_features:
                        logging.debug(
                            f"Feature mismatch: reported {reported_features}, actual {num_features}. Using actual.")
            except Exception:
                logging.debug(f"Feature verification failed. Using reported features: {reported_features}")
                num_features = reported_features

            self.classifier = nn.Sequential(
                nn.Linear(num_features, dense_units),
                nn.ReLU(),
                nn.BatchNorm1d(dense_units),
                nn.Dropout(dropout),
                nn.Linear(dense_units, 1),
            )
        except Exception as e:
            logging.error(f"Error initializing CustomModel architecture '{model_name}': {e}", exc_info=True)
            raise

    def forward(self, x):
        if self.model_name == "ViT_Base":
            features = self.base_model(x).last_hidden_state[:, 0]
        else:
            features = self.base_model(x)
        output = self.classifier(features)
        return output

def parse_args():
    parser = argparse.ArgumentParser(description='Image Falsification Detection with XAI')
    parser.add_argument('--model', required=True, type=Path, help='Path to PyTorch model state_dict file (.pth)')
    parser.add_argument('--image', required=True, type=Path, help='Path to image file to analyze')
    parser.add_argument('--output', required=True, type=Path, help='Path to save JSON output')
    parser.add_argument('--arch', required=True, type=str, help='Architecture name used during training')
    parser.add_argument('--img-height', required=True, type=int, help='Image height the model expects')
    parser.add_argument('--img-width', required=True, type=int, help='Image width the model expects')
    parser.add_argument('--dense-units', required=True, type=int, help='Number of dense units in the classifier head')
    parser.add_argument('--dropout', required=True, type=float, help='Dropout rate used in the classifier head')
    parser.add_argument('--xai-output-dir', required=True, type=Path, help='Directory to save XAI visualization images')
    parser.add_argument('--shap-background-dir', type=Path, help='Directory containing background images for SHAP')
    return parser.parse_args()

def load_model(model_path, arch, dense_units, dropout):
    logging.info(f"Attempting to load model state_dict from: {model_path}")
    try:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = CustomModel(
            model_name=arch,
            dense_units=dense_units,
            dropout=dropout,
            pretrained=False,
            unfreeze_layers=0
        )
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()
        model.to(device)
        logging.info(f"Model loaded successfully on {device}")
        return model, device
    except Exception as e:
        logging.error(f"Error loading model: {e}", exc_info=True)
        raise

def preprocess_image(image_path, img_height, img_width, return_numpy=False):
    logging.debug(f"Preprocessing image: {image_path} to size ({img_height}, {img_width})")
    try:
        img = Image.open(image_path).convert('RGB')
        imagenet_mean = [0.485, 0.456, 0.406]
        imagenet_std = [0.229, 0.224, 0.225]
        if return_numpy:
            transform = A.Compose([
                A.Resize(img_height, img_width),
                A.Normalize(mean=imagenet_mean, std=imagenet_std),
            ])
            image_np = np.array(img)
            augmented = transform(image=image_np)
            return augmented['image']
        else:
            transform = A.Compose([
                A.Resize(img_height, img_width),
                A.Normalize(mean=imagenet_mean, std=imagenet_std),
                ToTensorV2(),
            ])
            image_np = np.array(img)
            augmented = transform(image=image_np)
            img_tensor = augmented['image'].unsqueeze(0)
            return img_tensor
    except Exception as e:
        logging.error(f"Error preprocessing image {image_path}: {e}", exc_info=True)
        raise

def generate_heatmap_overlay(image, heatmap_data, colormap='viridis', alpha=0.6):
    if image.dtype == np.float32 or image.dtype == np.float64:
        image = (image * 255).astype(np.uint8)
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    elif image.shape[2] == 3 and image.dtype == np.uint8:
        pass
    elif image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

    # Ensure heatmap_data is 2D
    if heatmap_data.ndim > 2:
        heatmap_data = np.mean(heatmap_data, axis=0)
    if heatmap_data.ndim != 2:
        raise ValueError("heatmap_data must be 2D")

    # Normalize heatmap_data
    if np.nanmax(heatmap_data) > 1.0 or np.nanmin(heatmap_data) < 0.0:
        heatmap_data = np.clip(heatmap_data, 0, np.nanmax(heatmap_data))
        max_val = np.nanmax(heatmap_data)
        if max_val > 1e-6:
            heatmap_data = heatmap_data / max_val
        else:
            heatmap_data = np.zeros_like(heatmap_data)

    cmap = matplotlib.colormaps.get_cmap(colormap)
    heatmap_colored = cmap(heatmap_data)[:, :, :3]
    heatmap_colored = (heatmap_colored * 255).astype(np.uint8)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_RGB2BGR)

    # Ensure shapes match
    if heatmap_colored.shape[:2] != image.shape[:2]:
        raise ValueError(f"Shape mismatch: image {image.shape[:2]}, heatmap {heatmap_colored.shape[:2]}")

    overlay = cv2.addWeighted(image, 1 - alpha, heatmap_colored, alpha, 0)
    return overlay

def generate_gradcam(model, img_tensor, device, xai_output_dir, image_name):
    logging.info("Generating Grad-CAM visualization")
    try:
        class BinaryClassifierOutputTarget:
            def __init__(self, target_class):
                self.target_class = target_class
            def __call__(self, model_output):
                return model_output if self.target_class == 1 else -model_output

        input_tensor = img_tensor.to(device)
        with torch.no_grad():
            output = model(input_tensor)
            prob = torch.sigmoid(output).item()
        predicted_class = 1 if prob > 0.5 else 0

        target_layers = [model.base_model.blocks[2][0].conv_pwl]
        grad_cam = GradCAM(model=model, target_layers=target_layers)
        targets = [BinaryClassifierOutputTarget(predicted_class)]
        cam = grad_cam(input_tensor=input_tensor, targets=targets)[0]

        img_numpy = preprocess_image(image_name, 224, 224, return_numpy=True)
        overlay = generate_heatmap_overlay(img_numpy, cam, colormap='jet', alpha=0.6)
        output_path = xai_output_dir / f"{image_name.stem}_gradcam.png"
        cv2.imwrite(str(output_path), overlay)
        logging.info(f"Grad-CAM saved to {output_path}")
        return str(output_path)
    except Exception as e:
        logging.error(f"Error generating Grad-CAM: {e}", exc_info=True)
        return None

def generate_lime(model, img_tensor, img_numpy, device, xai_output_dir, image_name):
    logging.info("Generating LIME visualization")
    try:
        logging.debug("Starting LIME explainer")
        def predict_fn(images):
            logging.debug(f"Predicting for {len(images)} images")
            images_tensor = torch.stack([torch.from_numpy(img.transpose(2, 0, 1)).float() for img in images]).to(device)
            normalize = A.Compose([A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])
            for i in range(images_tensor.shape[0]):
                img_np = images_tensor[i].cpu().numpy().transpose(1, 2, 0)
                normalized_img = normalize(image=img_np)['image']  # Normalize (HWC)
                images_tensor[i] = torch.from_numpy(normalized_img.transpose(2, 0, 1)).to(device)  # Convert back to CHW
            model.eval()
            with torch.no_grad():
                outputs = model(images_tensor)
                probs = torch.sigmoid(outputs).cpu().numpy()
            return np.hstack([1 - probs, probs])

        explainer = lime_image.LimeImageExplainer()
        logging.debug("Running LIME explanation")
        explanation = explainer.explain_instance(
            img_numpy,
            predict_fn,
            top_labels=2,
            hide_color=0,
            num_samples=500
        )
        logging.debug("LIME explanation generated, creating visualization")
        with torch.no_grad():
            output = model(img_tensor.to(device))
            prob = torch.sigmoid(output).item()
        predicted_class = 1 if prob > 0.5 else 0

        temp, mask = explanation.get_image_and_mask(
            label=predicted_class,
            positive_only=True,
            num_features=5,
            hide_rest=False
        )
        overlay = mark_boundaries(img_numpy / 255.0, mask)
        overlay = (overlay * 255).astype(np.uint8)
        output_path = xai_output_dir / f"{image_name.stem}_lime.png"
        cv2.imwrite(str(output_path), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        logging.info(f"LIME saved to {output_path}")
        return str(output_path)
    except Exception as e:
        logging.error(f"Error generating LIME: {e}", exc_info=True)
        return None

def generate_shap(model, img_tensor, device, xai_output_dir, image_name, shap_background_dir):
    logging.info("Generating SHAP visualization")
    try:
        background_files = []
        if shap_background_dir and shap_background_dir.is_dir():
            for f in shap_background_dir.iterdir():
                if f.is_file() and f.suffix.lower() in ('.png', '.jpg', '.jpeg'):
                    background_files.append(f)
            background_files = random.sample(background_files, min(50, len(background_files))) if len(background_files) > 50 else background_files
        if not background_files:
            logging.warning("No background images for SHAP. Skipping SHAP.")
            return None

        background_tensors = []
        for f in background_files:
            tensor = preprocess_image(f, 224, 224)
            if tensor is not None:
                background_tensors.append(tensor.squeeze(0))
        if not background_tensors:
            logging.warning("Failed to load background images for SHAP. Skipping SHAP.")
            return None
        background_data = torch.stack(background_tensors).to(device)

        explainer = shap.GradientExplainer(model, background_data)
        shap_values = explainer.shap_values(img_tensor.to(device))
        shap_values = shap_values[0] if isinstance(shap_values, list) else shap_values

        # Debug logging
        logging.debug(f"SHAP values shape before processing: {shap_values.shape}")

        # Process the SHAP values to get a proper 2D heatmap
        # First, get the absolute values and convert to numpy if needed
        if torch.is_tensor(shap_values):
            shap_values = shap_values.cpu().numpy()
        shap_abs = np.abs(shap_values)

        # Handle different dimensions
        if shap_abs.ndim == 4:  # [batch, channel, height, width]
            shap_heatmap = shap_abs.mean(axis=(0, 1))  # Average over batch and channel
        elif shap_abs.ndim == 3:  # [channel, height, width]
            shap_heatmap = shap_abs.mean(axis=0)  # Average over channel
        elif shap_abs.ndim == 2:
            shap_heatmap = shap_abs  # Already 2D
        elif shap_abs.ndim == 1:
            # If 1D array, need to reshape to 2D
            shap_heatmap = shap_abs.reshape(-1, 1)
        else:
            # Unexpected dimensions
            logging.warning(f"Unexpected SHAP values dimensions: {shap_abs.ndim}")
            # Try to create a 2D array of the right size
            shap_heatmap = np.zeros((224, 224))

        # Ensure the heatmap is the right size (224x224)
        if shap_heatmap.shape != (224, 224):
            logging.debug(f"Resizing SHAP heatmap from {shap_heatmap.shape} to (224, 224)")
            # If the heatmap is (224, 1), reshape it to (224, 224) by repeating columns
            if shap_heatmap.shape == (224, 1):
                shap_heatmap = np.repeat(shap_heatmap, 224, axis=1)
            # If other shape, use cv2 to resize
            else:
                shap_heatmap = cv2.resize(shap_heatmap, (224, 224))

        # Normalize the heatmap
        shap_heatmap = np.clip(shap_heatmap, 0, None)
        max_val = np.max(shap_heatmap)
        if max_val > 0:
            shap_heatmap = shap_heatmap / max_val

        logging.debug(f"Final SHAP heatmap shape: {shap_heatmap.shape}")

        img_numpy = preprocess_image(image_name, 224, 224, return_numpy=True)
        overlay = generate_heatmap_overlay(img_numpy, shap_heatmap, colormap='hot', alpha=0.6)
        output_path = xai_output_dir / f"{image_name.stem}_shap.png"
        cv2.imwrite(str(output_path), overlay)
        logging.info(f"SHAP saved to {output_path}")
        return str(output_path)
    except Exception as e:
        logging.error(f"Error generating SHAP: {e}", exc_info=True)
        return None
def detect_falsification(model, img_tensor, device):
    logging.debug(f"Running inference on device: {device}")
    try:
        img_tensor = img_tensor.to(device)
        with torch.no_grad():
            output_logits = model(img_tensor)
            probability_falsified = torch.sigmoid(output_logits).item()
            is_falsified = bool(probability_falsified > 0.5)
            confidence = probability_falsified
            result = {
                "isFalsified": is_falsified,
                "confidenceScore": confidence,
                "detectionDetails": {
                    "logit_value": output_logits.item(),
                }
            }
            logging.info(f"Inference complete. Falsified: {is_falsified}, Confidence: {confidence:.4f}")
            return result
    except Exception as e:
        logging.error(f"Error during model inference: {e}", exc_info=True)
        raise

def main():
    args = parse_args()
    output_path = args.output
    xai_output_dir = args.xai_output_dir
    image_name = args.image

    try:
        if not args.model.is_file():
            raise FileNotFoundError(f"Model file not found: {args.model}")
        if not args.image.is_file():
            raise FileNotFoundError(f"Image file not found: {args.image}")

        xai_output_dir.mkdir(parents=True, exist_ok=True)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        logging.info(f"Output JSON: {output_path}, XAI outputs: {xai_output_dir}")

        model, device = load_model(args.model, args.arch, args.dense_units, args.dropout)
        img_tensor = preprocess_image(args.image, args.img_height, args.img_width)
        img_numpy = preprocess_image(args.image, args.img_height, args.img_width, return_numpy=True)
        result = detect_falsification(model, img_tensor, device)

        result["xaiVisualizations"] = {}
        gradcam_path = generate_gradcam(model, img_tensor, device, xai_output_dir, image_name)
        if gradcam_path:
            result["xaiVisualizations"]["gradcam"] = gradcam_path
        lime_path = generate_lime(model, img_tensor, img_numpy, device, xai_output_dir, image_name)
        if lime_path:
            result["xaiVisualizations"]["lime"] = lime_path
        shap_path = generate_shap(model, img_tensor, device, xai_output_dir, image_name, args.shap_background_dir)
        if shap_path:
            result["xaiVisualizations"]["shap"] = shap_path

        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
        logging.info(f"Analysis and XAI visualizations completed successfully")
        return 0
    except Exception as e:
        error_message = f"Error during analysis: {str(e)}"
        logging.error(error_message, exc_info=True)
        try:
            with open(output_path, 'w') as f:
                json.dump({"error": error_message}, f, indent=2)
        except Exception as write_err:
            logging.error(f"Failed to write error details: {write_err}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())