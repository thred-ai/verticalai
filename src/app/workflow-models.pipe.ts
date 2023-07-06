import { Pipe, PipeTransform } from '@angular/core';
import {
  BranchedStep,
  Sequence,
  SequentialStep,
} from 'sequential-workflow-designer';
import { LoadService } from './load.service';
import { AIModel } from './models/workflow/ai-model.model';
import { Workflow } from './models/workflow/workflow.model';

@Pipe({
  name: 'workflowModels',
})
export class WorkflowModelsPipe implements PipeTransform {
  constructor(private loadService: LoadService) {}

  transform(value: Workflow): { model: AIModel; count: number }[] {
    var def = value.layout;
    let loadedModels = this.loadService.loadedModels.value;

    var models: { model: AIModel; count: number }[] = [];

    function analyzeTasks(tasks: Sequence) {
      tasks.forEach((task) => {
        if (task.componentType == 'switch') {
          let switchTask = task as BranchedStep;
          Object.values(switchTask.branches).forEach((sequence) => {
            analyzeTasks(sequence);
          });
        } else if (task.componentType == 'container') {
          let loopTask = task as SequentialStep;
          analyzeTasks(loopTask.sequence);
        } else if (
          task.componentType == 'task' &&
          task.properties['type'] == 'model'
        ) {
          let id = task.type.split('-')[1];
          let sameModel = loadedModels[id].models[task.type];

          if (sameModel) {
            let sameIndex = models.findIndex((m) => m.model.id == task.type);
            if (sameIndex > -1) {
              models[sameIndex].count += 1;
            } else {
              models.push({
                model: JSON.parse(JSON.stringify(sameModel)) as AIModel,
                count: 1,
              });
            }
          }
        } else {
          return;
        }
      });
    }

    analyzeTasks(def.sequence);

    return models;
  }
}
