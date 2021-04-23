/* 
  В качестве оригинала даётся объект, представляющий собой дерево заранее неизвестной глубины
  Листья дерева ― строки с {placeholder}'ами
  Результатом должен быть объект такой же формы, как и оригинал
  Листья дерева ― format-функции, заменяющие плейсхолдеры значениями из аргумента-объекта
  Сигнатура format-функции:
    (vars?: { [key: string]: string | number }) => string
  NOTE: можно использовать готовую реализацию format-функции
 */

const sourceStrings = {
  hello: 'Добрый вечор, {username}!',
  admin: {
    objectForm: {
      label: 'Пароль администратора',
      hint: 'Не менее {minLength} символов. Сейчас ― {length}',
    },
  },
};


const t = i18n(sourceStrings);

const testFormat = 'Добрый вечор, me!' === t.hello({ username: 'me' });
console.assert(testFormat, '  ❌ First level failed!');

const testDepth = 'Пароль администратора' === t.admin.objectForm.label();
console.assert(testDepth, '  ❌ Generic depth failed!');

const testDepthFmt =
  'Не менее 8 символов. Сейчас ― 6' ===
  t.admin.objectForm.hint({ minLength: 8, length: 6 });
console.assert(testDepthFmt, '  ❌ Variables failed');

if (testDepth && testDepthFmt && testFormat)
  console.log('🎉 Good! All tests passed.');

// === implementation ===

type FormatFunction = (vars?: { [key: string]: string | number }) => string;

type Input = {
    [index: string]: Input | string
};
type Result<T> = {
 [key in keyof T]: T[key] extends string ? FormatFunction : Result<T[key]> 
};

function i18n<T extends Input>(strings: T): Result<T> {
  const result: Result<T> = {} as Result<T>;
  for (const key in strings) {
      const str = strings[key];
      if(typeof str === 'string') {
        Object.defineProperty(result, key, {
            enumerable: true,
            configurable: true,
            value: getTemplateFunction(str),
            writable: true
        });
      } else if(shallowInputTypeCheck(str)){
        Object.defineProperty(result, key,  {
            enumerable: true,
            configurable: true,
            value: i18n(str),
            writable: true
        });
      }
    }
  return result;
}

function getTemplateFunction(str: string): FormatFunction {
    return function (vars?: { [key: string]: string | number }): string {
        for (let key in vars ) {
            str = str.replace(new RegExp("\\{" + key + "\\}", 'g'), vars[key].toString());
        }
        return str;
    }
}

function isInputType<T extends Input>(input: any): input is Input {
  for(let key in input ) {
    if (typeof key != 'string' || !(typeof input[key] == 'string' || isInputType(input[key]))) return false;
  }
  return true;
}

function shallowInputTypeCheck<T extends Input>(input: any): input is Input {
  for(let key in input ) {
    if (typeof key != 'string' || !(typeof input[key] == 'string' || typeof input[key] == 'object')) return false;
  }
  return true;
}

function checkResultShape<T extends Input>(input: Input, result: any): result is Result<T> {
  for(let key in input ) {
    if(!(key in result)) return false;
    if(typeof input[key] == 'string' && typeof result[key] != 'function') return false;
    if(typeof input[key] != 'string' && !checkResultShape(input[key] as Input, result[key])) return false;
  }
  return true;
}