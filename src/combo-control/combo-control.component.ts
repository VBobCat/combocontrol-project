import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  Optional,
  Self,
  signal, viewChild
} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {debounceTime, distinctUntilChanged, filter, map, tap} from 'rxjs';

@Component({
  selector: 'app-combo-control',
  imports: [MatAutocompleteModule, MatInputModule, ReactiveFormsModule,
  ],
  template: `<input
    (blur)="onBlur($event)"
    [formControl]="fcInput"
    [matAutocomplete]="auto"
    matInput
  >
  <mat-autocomplete
    #auto="matAutocomplete"
    (optionSelected)="onChange($event.option.value)"
    [displayWith]="displayFn()"
  >
    @for (option of filteredlist(); track option.value) {
      <mat-option [value]="option.value">{{ option.display }}</mat-option>
    }
  </mat-autocomplete>`,
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: ComboControlComponent, multi: true}]
})
export class ComboControlComponent implements ControlValueAccessor {

  fcInput = new FormControl('', {nonNullable: true});

  fcSelect = new FormControl<any>(null);

  datasource = input<any[]>([]);

  disabledState = signal<boolean>(false);

  display = input<null | string | ((o: any) => string)>(null);

  evaluate = input<null | string | ((o: any) => any)>(null);

  ascii = (s: string) => s.toLowerCase()
    .replaceAll(/[áâàäã]/gu, 'a')
    .replaceAll(/ç/gu, 'c')
    .replaceAll(/[éêèë]/gu, 'e')
    .replaceAll(/[íîìï]/gu, 'i')
    .replaceAll(/ñ/gu, 'n')
    .replaceAll(/[óôòöõ]/gu, 'o')
    .replaceAll(/[úûùü]/gu, 'u')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')

  listsource = computed(() => {
    const displayer = this.display();
    const displaylist = typeof displayer === 'string' ? this.datasource().map(v => String(v[displayer]))
      : typeof displayer === 'function' ? this.datasource().map(v => displayer(v))
        : this.datasource().map((v, i) => `${v} #${i}`);
    const evaluator = this.evaluate();
    const valuelist = typeof evaluator === 'string' ? this.datasource().map(v => v[evaluator])
      : typeof evaluator === 'function' ? this.datasource().map(v => evaluator(v))
        : this.datasource().map(v => v);
    return displaylist.map((display, i) => ({display, ascii: this.ascii(display).split(/\s+/gu), value: valuelist[i]}))
  });

  inputAscii = toSignal(
    this.fcInput.valueChanges.pipe(
      filter(v => typeof (v as unknown) === 'string'),
      debounceTime(500),
      distinctUntilChanged(),
      tap(v => console.dir({texto: v})),
      map(v => this.ascii(v)),
    ), {initialValue: ''});

  filteredlist = computed(() => {
    const inputAsciiWords = this.inputAscii().split(/\s+/gu);
    return this.listsource()
      .filter(item => inputAsciiWords
        .every(inputWord => item.ascii
          .some(word => word.startsWith(inputWord))));
  });

  displayFn = computed(() => {
    const list = this.filteredlist();
    return (value: any) => list.find(item => item.value === value)?.display ?? '';
  })

  onChange = (v: any) => {
  };

  onTouched = () => {
  };

  writeValue(obj: any): void {
    const valueItem = this.listsource().find(item => item.value === obj);
    this.fcInput.setValue(valueItem?.display ?? '');
    this.fcSelect.setValue(valueItem?.value ?? null);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  constructor() {
    this.fcSelect.valueChanges.pipe(takeUntilDestroyed(), tap(v => console.log('value =', v))).subscribe(v => this.onChange && this.onChange(v));
    effect(() => {
      if (this.disabledState()) this.fcInput.disable(); else this.fcInput.enable();
    })
  }

  onBlur(_: FocusEvent) {
    if (this.onTouched) this.onTouched();
  }

  optionSelected(matAutocompleteSelectedEvent: MatAutocompleteSelectedEvent) {
    console.dir(matAutocompleteSelectedEvent);
  }
}
