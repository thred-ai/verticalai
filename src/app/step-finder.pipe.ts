import { Pipe, PipeTransform } from '@angular/core';
import { BranchedStep, Definition, Step } from 'sequential-workflow-designer';

@Pipe({
  name: 'stepFinder'
})
export class StepFinderPipe implements PipeTransform {

  transform(definition: Definition, step: Step): | BranchedStep | undefined {
    console.log(definition)
    return definition.sequence.find(s => s.id == step.id) as BranchedStep;
  }

}
