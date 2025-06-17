import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from '../../pages/menu/menu.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {

}
