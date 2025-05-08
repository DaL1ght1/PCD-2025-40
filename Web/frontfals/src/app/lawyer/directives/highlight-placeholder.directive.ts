import { Directive,  ElementRef, HostListener,  Renderer2 } from "@angular/core"

@Directive({
  selector: "[appHighlightPlaceholder]",
  standalone: true,
})
export class HighlightPlaceholderDirective {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener("input") onInput() {

    const content = this.el.nativeElement.value
    console.log("Content changed, could apply highlighting here")
  }
}
