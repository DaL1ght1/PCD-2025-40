import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';


@Component({
  standalone: true,
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  imports: [
    RouterLink
  ],

  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

}
