import { ClassicPreset } from 'rete';

export class BaseCustomControl extends ClassicPreset.Control {
  public value: string = '';
  public onValueChange?: () => void;

  public setValue(value: string, notify: boolean = true) {
    if (this.value === value) return;
    this.value = value;
    if (notify) {
      this.onValueChange?.();
    }
  }
}
