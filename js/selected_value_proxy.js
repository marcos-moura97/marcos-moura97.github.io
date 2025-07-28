class SelectedValueProxy {
  constructor(initialValue, onChange) {
    this._value = initialValue;
    this._onChange = onChange;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "value") return target._value;
        return target[prop];
      },
      set: (target, prop, newVal) => {
        if (prop === "value") {
          const oldVal = target._value;
          if (newVal !== oldVal) {
            target._value = newVal;
            if (typeof target._onChange === "function") {
              target._onChange(newVal, oldVal);
            }
          }
          return true;
        }
        target[prop] = newVal;
        return true;
      },
    });
  }
}

export default SelectedValueProxy;
