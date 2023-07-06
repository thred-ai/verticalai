import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RangeCustomEvent } from '@ionic/angular';
import { CurrencyMaskInputMode } from 'ngx-currency';

@Component({
  selector: 'verticalai-layout-slider',
  templateUrl: './layout-slider.component.html',
  styleUrls: ['./layout-slider.component.scss']
})
export class LayoutSliderComponent implements OnInit {

  customCurrencyMaskConfig = {
    align: 'center',
    allowNegative: false,
    allowZero: true,
    decimal: '.',
    precision: 0,
    prefix: '',
    suffix: '',
    thousands: ',',
    min: 0,
    max: 100,
    inputMode: CurrencyMaskInputMode.NATURAL,
  };

  constructor() { }

  ngOnInit(): void {
  }

  @Output() valueChange = new EventEmitter<number>();

  @Input() value: number = 0

  @Input() min: number = 0
  @Input() max: number = 100

  sliderVal(event: Event){
    console.log((event as RangeCustomEvent).detail.value)
    let val = (event as RangeCustomEvent).detail.value as number
    if (val < this.min){
      val = this.min
    }
    if (val > this.max){
      val = this.max
    }
    return val
  }

  inputVal(val: number = 0){
    if (val < this.min){
      val = this.min
    }
    if (val > this.max){
      val = this.max
    }
    return val
  }

}
