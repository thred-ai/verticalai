import { Component, Input, OnInit } from '@angular/core';
import { Workflow } from '../models/workflow/workflow.model';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements OnInit {

  constructor() { }

  @Input() model?: Workflow

  ngOnInit(): void {
  }

}
