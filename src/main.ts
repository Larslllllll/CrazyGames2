import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const uiRoot = document.getElementById("ui") as HTMLElement;
const game = new Game(canvas, uiRoot);
(window as unknown as { __dwd: unknown }).__dwd = game.debugApi();
game.boot().catch((err: unknown) => {
  console.error(err);
  document.getElementById("boot")?.classList.add("hide");
});
