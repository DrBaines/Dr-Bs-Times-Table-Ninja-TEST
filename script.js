/* Times Tables Trainer — script.js (frontpage-GH47)
   - One-size-per-belt font on iPad/touch (no per-question resizing)
   - Title: "Dr B's Times Table Ninja — {Belt}"
   - Print/Save button (captures name, score, answers) + date dd/mm/yy
   - Answers: 5 columns; wrong = red; Quit button below answers
   - Keypad + keyboard; hidden timer; offline queue stubs
*/

// ... (all code unchanged up to the function buildPlatinumQuestions) ...

function buildPlatinumQuestions(total){
  const out = [];
  for (let i=0;i<total;i++){
    const t=randInt(1,3);
    if (t===1 || t===2) {
      // Regular multiplication
      const exps = [0,1,2];
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      if (t === 1)
          out.push({ q:`${bigA} × ${bigB}`, a:prod });
      else
          out.push({ q:`${bigB} × ${bigA}`, a:prod });
    } else {
      // Division, sometimes <1, sometimes ≥1
      // (10^e × a × b) ÷ a^f, with e,f randomized for variety
      const isLessThan1 = Math.random() < 0.5;
      let e, f, A, B;
      A = randInt(2, 12);
      B = randInt(1, 10);
      if (isLessThan1) {
        if (Math.random() < 0.5) {
          e = randInt(0, 1);
          f = 2;
        } else {
          e = 0;
          f = randInt(1, 2);
        }
      } else {
        if (Math.random() < 0.5) {
          e = randInt(1, 2);
          f = 0;
        } else {
          e = 2;
          f = randInt(0, 1);
        }
      }
      const numerator = Math.pow(10, e) * A * B;
      const denominator = Math.pow(A, f);
      const answer = numerator / denominator;
      const question = `${numerator} ÷ ${denominator}`;
      out.push({ q: question, a: answer });
    }
  }
  return shuffle(out).slice(0,total);
}

function buildObsidianQuestions(total){
  const out = [];
  const exps = [0,1,2];
  const half = Math.max(1, Math.floor(total/2));
  for (let i=0;i<half;i++){ 
    const t=(i%4)+1;
    if (t===1 || t===2) {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      if (t===1)
        out.push({ q:`___ × ${bigA} = ${prod}`, a:bigB });
      else
        out.push({ q:`${bigA} × ___ = ${prod}`, a:bigB });
    } else if (t===3) {
      // Division, sometimes <1, sometimes ≥1
      const isLessThan1 = Math.random() < 0.5;
      let e, f, A, B;
      A = randInt(2, 12);
      B = randInt(1, 10);
      if (isLessThan1) {
        if (Math.random() < 0.5) {
          e = randInt(0, 1);
          f = 2;
        } else {
          e = 0;
          f = randInt(1, 2);
        }
      } else {
        if (Math.random() < 0.5) {
          e = randInt(1, 2);
          f = 0;
        } else {
          e = 2;
          f = randInt(0, 1);
        }
      }
      const numerator = Math.pow(10, e) * A * B;
      const denominator = Math.pow(A, f);
      const answer = numerator / denominator;
      const question = `${numerator} ÷ ${denominator}`;
      out.push({ q: question, a: answer });
    } else {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      out.push({ q:`${prod} ÷ ___ = ${bigB}`, a:bigA });
    }
  }
  for (let i=half;i<total;i++){ 
    const t=randInt(1,6);
    if (t===1 || t===2) {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      if (t===1)
        out.push({ q:`___ × ${bigA} = ${prod}`, a:bigB });
      else
        out.push({ q:`${bigA} × ___ = ${prod}`, a:bigB });
    } else if (t===3) {
      // Division, sometimes <1, sometimes ≥1
      const isLessThan1 = Math.random() < 0.5;
      let e, f, A, B;
      A = randInt(2, 12);
      B = randInt(1, 10);
      if (isLessThan1) {
        if (Math.random() < 0.5) {
          e = randInt(0, 1);
          f = 2;
        } else {
          e = 0;
          f = randInt(1, 2);
        }
      } else {
        if (Math.random() < 0.5) {
          e = randInt(1, 2);
          f = 0;
        } else {
          e = 2;
          f = randInt(0, 1);
        }
      }
      const numerator = Math.pow(10, e) * A * B;
      const denominator = Math.pow(A, f);
      const answer = numerator / denominator;
      const question = `${numerator} ÷ ${denominator}`;
      out.push({ q: question, a: answer });
    } else if (t===4) {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      out.push({ q:`${prod} ÷ ___ = ${bigB}`, a:bigA });
    } else if (t===5) {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      out.push({ q:`${bigA} × ${bigB}`, a:prod });
    } else {
      const A=randInt(2,12), B=randInt(1,10);
      const e1=exps[randInt(0,exps.length-1)], e2=exps[randInt(0,exps.length-1)];
      const bigA=A*(10**e1), bigB=B*(10**e2), prod=bigA*bigB; 
      out.push({ q:`${bigB} × ${bigA}`, a:prod });
    }
  }
  return shuffle(out).slice(0,total);
}

// ... (rest of the full script.js code unchanged from 2c4bba6) ...