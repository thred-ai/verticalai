import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'verticalai-select-field',
  templateUrl: './select-field.component.html',
  styleUrls: ['./select-field.component.scss'],
})
export class SelectFieldComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() title: string = '';
  @Input() value: any;
  @Input() valueField?: string;
  @Input() displayField?: string;
  @Input() textColor: string = '#ffffff';
  @Input() bgColor: string = '#131313d4';
  @Input() placeholder: string = '';
  @Output() changed = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<any>();

  change(event: any){
    let val = event.detail.value as string
    this.changed.emit(val)
  }

  constructor() {}

  ngOnInit(): void {}
}
