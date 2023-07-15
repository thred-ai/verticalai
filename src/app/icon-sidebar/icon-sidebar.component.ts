import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Developer } from '../models/user/developer.model';
import { LoadService } from '../load.service';
import { AppComponent } from '../app.component';
import { WorkflowComponent } from '../workflow/workflow.component';

@Component({
  selector: 'app-icon-sidebar',
  templateUrl: './icon-sidebar.component.html',
  styleUrls: ['./icon-sidebar.component.scss'],
})
export class IconSidebarComponent implements OnInit {
  constructor(private loadService: LoadService, private workflowComponent: WorkflowComponent, public root: AppComponent) {}

  loadedUser?: Developer;

  selectedWorkflow?: string

  @Input() selectedIcon: string = 'settings'
  @Output() selectedIconChanged = new EventEmitter<string>();

  expandedProjects = true

  ngOnInit(): void {
    this.loadService.loadedUser.subscribe((l) => {
      if (l) {
        this.loadedUser = l;
        
      }
    });

    this.workflowComponent.workflow.subscribe(w => {
      if (w){
        this.selectedWorkflow = w.id
      }
    })
  }

  openSettings(){
    this.workflowComponent.openControllerSettings('main')
  }
}
