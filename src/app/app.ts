import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {ComboControlComponent} from '../combo-control/combo-control.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {HttpClient} from '@angular/common/http';
import {MatFormField} from '@angular/material/form-field';

@Component({
  selector: 'app-root',
  imports: [ComboControlComponent, MatFormField],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly http = inject(HttpClient);
  datasource = toSignal(
    this.http.get<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios'),
    {initialValue: []}
  );

  constructor() {
  }
}
