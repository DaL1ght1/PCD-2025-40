import { Pipe, PipeTransform } from '@angular/core';


@Pipe({standalone: true, name: 'replaceUnderscoreWithSpace'})
export class ReplaceUnderscoreWithSpacePipe implements PipeTransform {

  transform(value: string): string {
         if (!value) return '';
         return value.replace(/_/g, ' ');
       }
     }
