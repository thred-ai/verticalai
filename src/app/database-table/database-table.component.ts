import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Executable } from '../models/workflow/executable.model';
import { Dict, LoadService } from '../load.service';
import { Plan } from '../models/workflow/plan.model';
import { WorkflowComponent } from '../workflow/workflow.component';

@Component({
  selector: 'app-database-table',
  templateUrl: './database-table.component.html',
  styleUrls: ['./database-table.component.css'],
})
export class DatabaseTableComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Output() clicked = new EventEmitter<{ app: Executable; mode: number }>();
  @Output() planClicked = new EventEmitter<{plan: string, index: number}>();


  workflow?: Executable

  @Input() count: number = 0;

  open(app: Executable, mode = 0) {
    this.clicked.emit({ app, mode });
  }

  dataSource?: MatTableDataSource<Executable>;

  displayedColumns2: string[] = [
    'collections',
    'embeddings',
    'text',
  ];

  plans: Dict<Plan> = {};

  ngOnChanges() {
    this.cdr.detectChanges();
  }

  @ViewChild(MatPaginator) paginator1?: MatPaginator;

  constructor(
    private cdr: ChangeDetectorRef,
    private loadService: LoadService,
    private workflowComponent: WorkflowComponent
  ) {}

  ngOnInit(): void {
    this.workflowComponent.workflow.subscribe(w => {
      this.workflow = w
    })
  }

  ngAfterViewInit() {}
}
