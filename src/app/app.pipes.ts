import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { APPSHARED } from './app-setting';
import { IDropList } from './models/data-model';

// Convert UTC to local date/time
@Pipe({ name: 'utcToLocal' })
export class UtcToLocal implements PipeTransform {
  transform(value: string, format: string): string {
    if (!value) return '';

    format = format || 'DD/MM/YY HH:mm a';
    return moment.utc(value).local().format(format);
  }
}

// Get employee name from ID
@Pipe({ name: 'employeeIdToName' })
export class EmployeeIdToName implements PipeTransform {
  transform(value: string, employees: Array<any>): string {
    const employee = _.find(employees, function (o) {
      return o.objectId == value;
    });

    if (employee) {
      return employee.name
        ? employee.name
        : `${employee.firstName} ${employee.lastName}`;
    }
    return '';
  }
}

// Filter droplist by category
@Pipe({ name: 'filterDropListByCategory' })
export class FilterDropListByCategory implements PipeTransform {
  transform(
    value: string,
    dropList: Array<any>,
    category: string
  ): Array<IDropList> {
    const filteredList = _.filter(dropList, (o) => {
      if (o.category == category) return o;
    });

    return filteredList;
  }
}
