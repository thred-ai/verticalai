import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Executable } from '../models/workflow/executable.model';

@Component({
  selector: 'app-workflow-code',
  templateUrl: './workflow-code.component.html',
  styleUrls: ['./workflow-code.component.scss'],
})
export class WorkflowCodeComponent implements OnInit {
  constructor(private ngZone: NgZone) {}

  @Input() code!: string;
  @Output() codeChanged = new EventEmitter<string>();

  ngOnInit(): void {

  }


  async changed($event: string) {

      this.codeChanged.emit($event)
    
  }
}
