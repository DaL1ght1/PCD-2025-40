import { Pipe,  PipeTransform } from "@angular/core"
import  { DocumentTemplate } from "../../core/models/lawyer.model"

@Pipe({
  name: "filterByCategory",
  standalone: true,
})
export class FilterByCategoryPipe implements PipeTransform {
  transform(templates: DocumentTemplate[], category: string): DocumentTemplate[] {
    if (!templates || !category || category === "all") {
      return templates
    }

    return templates.filter((template) => template.category === category)
  }
}
