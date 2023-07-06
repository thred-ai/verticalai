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
import { Workflow } from '../models/workflow/workflow.model';
import { Dict, LoadService } from '../load.service';
import { Plan } from '../models/workflow/plan.model';

@Component({
  selector: 'app-collection-table',
  templateUrl: './collection-table.component.html',
  styleUrls: ['./collection-table.component.css'],
})
export class CollectionTableComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Output() clicked = new EventEmitter<{ app: Workflow; mode: number }>();
  @Output() planClicked = new EventEmitter<{plan: string, index: number}>();

  @Input() set utils(utils: Workflow[]) {
    setTimeout(() => {
      this.dataSource = new MatTableDataSource<Workflow>(utils);
      this.dataSource!.paginator = this.paginator1!;
      this.cdr.detectChanges();
    }, 200);
  }

  @Input() count: number = 0;

  open(app: Workflow, mode = 0) {
    this.clicked.emit({ app, mode });
  }

  dataSource?: MatTableDataSource<Workflow>;

  displayedColumns2: string[] = [
    'image',
    'requests',
    'models',
    'plan',
    'action',
  ];

  plans: Dict<Plan> = {};

  ngOnChanges() {
    this.cdr.detectChanges();
  }

  @ViewChild(MatPaginator) paginator1?: MatPaginator;

  constructor(
    private cdr: ChangeDetectorRef,
    private loadService: LoadService
  ) {}

  ngOnInit(): void {
    this.loadService.loadedPlans.subscribe((plan) => {
      console.log(plan)
      this.plans = plan ?? {};
    });
  }

  ngAfterViewInit() {}
}
