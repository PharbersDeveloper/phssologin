import { helper } from '@ember/component/helper';

export function bpInverse(params/*, hash*/) {
  return !params[0];
}

export default helper(bpInverse);
