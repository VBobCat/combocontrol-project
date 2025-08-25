import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-combo-control',
  imports: [MatAutocompleteModule, MatInputModule, ReactiveFormsModule,
  ],
  template: `<input matInput [formControl]="fcInput">
  <mat-autocomplete #auto="matAutocomplete">
    @for (option of filteredlist(); track option.value) {
      <mat-option [value]="option.value">{{option.display}}</mat-option>
    }
  </mat-autocomplete>`,
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboControlComponent {
  datasource = input<any[]>([]);
  display = input<null | string | ((o: any) => string)>(null);
  evaluate = input<null | string | ((o: any) => any)>(null);
  ascii = (s: string) => s.toLocaleLowerCase()
    .replaceAll(/áâàäã/gu, 'a').replaceAll(/ç/gu, 'c').replaceAll(/éêèë/gu, 'e').replaceAll(/íîìï/gu, 'i')
    .replaceAll(/ñ/gu, 'n').replaceAll(/óôòöõ/gu, 'o').replaceAll(/úûùü/gu, 'u').replaceAll(/\W+/gu, ' ')
  listsource = computed(() => {
    const displayer = this.display();
    const displaylist = typeof displayer === 'string' ? this.datasource().map(v => String(v[displayer]))
      : typeof displayer === 'function' ? this.datasource().map(v => displayer(v))
        : this.datasource().map((v, i) => `${v} #${i}`);
    const evaluator = this.evaluate();
    const valuelist = typeof evaluator === 'string' ? this.datasource().map(v => v[evaluator])
      : typeof evaluator === 'function' ? this.datasource().map(v => evaluator(v))
        : this.datasource().map(v => v);
    return displaylist.map((display, i) => ({ display, ascii: this.ascii(display), value: valuelist[i] }))
  });
  fcInput = new FormControl('', { nonNullable: true });
  inputAscii = toSignal(this.fcInput.valueChanges.pipe(map(v => this.ascii(v)), debounceTime(500), distinctUntilChanged(), map(v => v.split(' '))), { initialValue: [] });
  filteredlist = computed(() => {
    const inputAscii = this.inputAscii();
    return this.listsource().filter(item => inputAscii.every(w => item.ascii.includes(w)));
  });
}
