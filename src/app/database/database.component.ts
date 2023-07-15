import { Component, OnInit } from '@angular/core';
import { Executable } from '../models/workflow/executable.model';
import { WorkflowComponent } from '../workflow/workflow.component';
import { TaskTree } from '../models/workflow/task-tree.model';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
})
export class DatabaseComponent implements OnInit {
  executable?: Executable;

  items: TaskTree[] = [];

  selectedFile: string = '';

  constructor(private workflowComponent: WorkflowComponent) {}

  ngOnInit(): void {
    let items = [
      new TaskTree('JordanGPT1', '1', 'category', [
        new TaskTree('My Name is Arta!', '1', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
        new TaskTree('My Name is Arta 2!', '1', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        })
      ]),
      new TaskTree('JordanGPT2', '2', 'category', [
        new TaskTree('My Name is Jordan!', '2', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
      ]),
      new TaskTree('JordanGPT3', '3', 'category', [
        new TaskTree('My Name is Kazi!', '3', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
      ]),
      new TaskTree('JordanGPT4', '4', 'category', [
        new TaskTree('My Name is Tony!', '4', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
      ]),
      new TaskTree('JordanGPT5', '5', 'category', [
        new TaskTree('My Name is Alex!', '5', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
      ]),
      new TaskTree('JordanGPT6', '6', 'category', [
        new TaskTree('My Name is Arvin!', '6', 'model', [], undefined, {
          embedding: JSON.stringify([0.1, 0.3, 0.8]),
        }),
      ]),
    ];

    this.workflowComponent.workflow.subscribe((w) => {
      this.executable = w;
      this.items = [new TaskTree('Collections', 'main', 'category', items)];
    });
  }
}
