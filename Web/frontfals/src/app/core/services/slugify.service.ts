import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'slugify'
})

export class SlugifyPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    return value
      .toString()
      .toLowerCase() // Ensure lowercase (though lowercase pipe is applied earlier)
      .trim() // Remove leading/trailing spaces
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}
