import { Flow } from "./components/flow/flow";
import { Logo } from "./components/logo/logo";

import "./global.css";

export default () => {
  return (
    <>
      <head>
        <meta charset="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body class="absolute inset-0 flex flex-col">
        <Logo />
        <div class="relative flex-1">
          <Flow />
        </div>
      </body>
    </>
  );
};
