import { Component, Input, ContentChild, TemplateRef } from "@angular/core"
import {NgClass, NgIf, NgTemplateOutlet} from '@angular/common';


@Component({

  standalone: true,
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.scss"],

  imports: [
    NgIf,
    NgClass,
    NgTemplateOutlet
  ]
})
export class CardComponent {
  @Input() title?: string
  @Input() hover = false
  @ContentChild("footer") footerTemplate?: TemplateRef<any>
}
