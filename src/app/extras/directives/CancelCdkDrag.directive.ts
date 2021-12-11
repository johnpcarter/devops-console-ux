import {Directive, ElementRef, OnDestroy, OnInit} from '@angular/core'

@Directive({
  selector: '[appCancelCdkDrag]'
})
export class CancelCdkDrag implements OnInit, OnDestroy {
  $element: HTMLElement

  constructor(el: ElementRef) {
    this.$element = el.nativeElement
  }

  fireMouseUp($event: MouseEvent) {
    $event.cancelBubble = true
  }

  ngOnDestroy(): void {
    this.$element.removeEventListener('mousedown', this.fireMouseUp)
    this.$element.removeEventListener('keydown', this.fireMouseUp)
  }

  ngOnInit(): void {
    this.$element.addEventListener('mousedown', this.fireMouseUp)
  }

}
