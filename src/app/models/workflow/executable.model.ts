import { Dict } from 'src/app/load.service';
import { Agent } from './agent.model';
import { Definition } from 'sequential-workflow-designer';

export class Executable {
  name!: string;
  id!: string;
  agents!: Dict<Agent>;
  schema!: Definition;
  img!: string

  constructor(
    name: string,
    id: string,
    agents: Dict<Agent> = {}
  ) {
    this.name = name ?? 'New App';
    this.id = id;
    this.agents = agents;
  }
}
