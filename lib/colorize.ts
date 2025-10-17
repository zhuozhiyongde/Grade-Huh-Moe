import { courseGpaFromNormalizedScore, guessScoreFromGpa, isFail, isFull } from "./scoreParser";

function prec(score: string | number, judgeByGpa: boolean | null | undefined) {
  if (judgeByGpa) {
    const gpa = courseGpaFromNormalizedScore(score);
    if (gpa === null) return 0;
    return (gpa - 1) / 3;
  }
  const normalizedScore = guessScoreFromGpa(courseGpaFromNormalizedScore(score));
  const num = Number(normalizedScore);
  if (Number.isNaN(num)) return 0;
  return (num - 60) / 40;
}

function cannotJudge(score: string | number) {
  return courseGpaFromNormalizedScore(score) === null;
}

export function colorizeSemester(
  score: string | number,
  judgeByGpa: boolean | null | undefined,
): string {
  if (cannotJudge(score)) return "hsl(240,50%,90%)";
  return `hsl(${120 * prec(score, judgeByGpa)},${judgeByGpa ? 97 : 100}%,70%)`;
}

export function colorizeCourse(
  score: string | number,
  judgeByGpa: boolean | null | undefined,
): string {
  if (cannotJudge(score) || Number(score) < 60) return "hsl(340,60%,65%)";
  return `hsl(${120 * prec(score, judgeByGpa)},${judgeByGpa ? 57 : 60}%,65%)`;
}

export function colorizeCourseBar(
  score: string | number,
  judgeByGpa: boolean | null | undefined,
): [string, string, number] {
  let colorL;
  let colorR;
  let width;
  if (cannotJudge(score) || Number(score) < 60) {
    colorL = colorR = "hsl(240,50%,90%)";
    width = isFail(score) ? 0 : 1;
  } else {
    const p = prec(score, judgeByGpa);
    colorL = `hsl(${120 * p},${judgeByGpa ? 97 : 100}%,75%)`;
    colorR = `hsl(${120 * p},${judgeByGpa ? 97 : 100}%,70%)`;
    width = Math.max(p, 0.01);
  }
  return [colorL, colorR, width];
}

export function colorizeNewBlock() {
  return "hsl(0,0%,90%)";
}

export function makeScoreGradient(
  score: number | string,
  judgeByGpa: boolean | null | undefined,
) {
  if (isFull(score)) {
    return `linear-gradient(-45deg,
  hsl(120, 90%, 88%), hsl(0, 100%, 91%), hsl(240, 100%, 91%),
  hsl(120, 90%, 88%), hsl(0, 100%, 91%), hsl(240, 100%, 91%),
  hsl(120, 90%, 88%), hsl(0, 100%, 91%), hsl(240, 100%, 91%),
  hsl(120, 90%, 88%), hsl(0, 100%, 91%), hsl(240, 100%, 91%),
  hsl(120, 90%, 88%)
) 0 0/1800px 200px`;
  }
  const [fgcolorl, fgcolorr, width] = colorizeCourseBar(score, judgeByGpa);
  const bgcolor = colorizeCourse(score, judgeByGpa);
  const widthPerc = `${width * 100}%`;
  return `linear-gradient(to right, ${fgcolorl}, ${fgcolorr} ${widthPerc}, ${bgcolor} ${widthPerc})`;
}
