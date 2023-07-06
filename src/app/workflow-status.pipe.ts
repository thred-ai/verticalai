import { Pipe, PipeTransform } from '@angular/core';
import { Workflow } from './models/workflow/workflow.model';

@Pipe({
  name: 'workflowStatus',
})
export class WorkflowStatusPipe implements PipeTransform {
  transform(value: Workflow[], status: number[]): Workflow[] {
    return value.filter((v) => {
      return status.find((s) => s == v.status) != undefined;
    });
  }
}
