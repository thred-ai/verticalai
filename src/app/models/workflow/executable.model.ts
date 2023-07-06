import { Dict } from 'src/app/load.service';
import { Agent } from './agent.model';

export class Executable {
  name!: string;
  id!: string;
  agents!: Dict<Agent>;

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
