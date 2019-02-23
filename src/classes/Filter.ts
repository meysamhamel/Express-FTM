import { Query, model, Document } from 'mongoose';
import { IRecipe } from './Recipe';

export default class Filter {
  public field: string;
  public operator: string;
  public values: any[];

  constructor(field: string, operator: string, values: string[]) {
    this.field = field;
    this.operator = operator;
    this.values = values;
  }

  public isValid = (): boolean => {
    return !!this.field && !!this.operator && !!this.values;
  };
}

export const applyFilters = (
  query: Query<Document> | Query<Document[]>,
  filters: Filter[]
): void => {
  for (const filter of filters) {
    const { field, operator, values } = filter;
    for (const value of values) {
      switch (operator) {
        case 'EQ':
          query.where(field).equals(value);
          break;
        case 'GT':
          query.where(field).gt(value);
          break;
        case 'LT':
          query.where(field).lt(value);
          break;
        case 'GTE':
          query.where(field).gte(value);
          break;
        case 'LTE':
          query.where(field).lte(value);
          break;
        case 'IN':
          query.where(field).elemMatch({ $regex: new RegExp(value, 'i') });
          break;
        case 'NIN':
          query.where({
            [field]: {
              $not: { $elemMatch: { $regex: new RegExp(value, 'i') } }
            }
          });
          break;
        default:
      }
    }
  }
};
