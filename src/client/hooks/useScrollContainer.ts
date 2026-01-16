import * as React from "react";

type Options = {
  behavior?: ScrollBehavior;
};

export function useScrollContainerToTop(
  deps: React.DependencyList = [],
  options: Options = {}
) {
  const { behavior = "auto" } = options;

  React.useLayoutEffect(() => {
    const el = document.getElementById("app-scroll-container");
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}