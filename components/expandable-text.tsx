"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const COLLAPSED_LINES = 3;

type ExpandableTextProps = {
  text: string;
  showMoreLabel: string;
  showLessLabel: string;
  id?: string;
  preserveWhitespace?: boolean;
};

export function ExpandableText({
  text,
  showMoreLabel,
  showLessLabel,
  id,
  preserveWhitespace = false,
}: ExpandableTextProps) {
  const generatedId = useId();
  const contentId = id ?? generatedId;
  const contentRef = useRef<HTMLParagraphElement>(null);
  const collapsedHeightRef = useRef(96);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const measure = () => {
      const style = getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const collapsedHeight = Number.isFinite(lineHeight)
        ? lineHeight * COLLAPSED_LINES
        : 96;
      collapsedHeightRef.current = collapsedHeight;

      const fullHeight = node.scrollHeight;
      const needsCollapse = fullHeight > collapsedHeight + 2;
      setCanExpand(needsCollapse);
      if (!expanded) {
        setHeight(needsCollapse ? collapsedHeight : "auto");
      }
    };

    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, expanded]);

  const toggle = () => {
    const node = contentRef.current;
    if (!node || !canExpand) return;

    if (expanded) {
      const fullHeight = node.scrollHeight;
      setHeight(fullHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(collapsedHeightRef.current);
          setExpanded(false);
        });
      });
      return;
    }

    const fullHeight = node.scrollHeight;
    setExpanded(true);
    setHeight(fullHeight);
  };

  return (
    <div className="mt-4 max-w-3xl">
      <div
        className={`detail-overview relative ${expanded ? "is-expanded" : "is-collapsed"} ${canExpand ? "cursor-pointer pb-8" : ""}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (!canExpand) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        aria-controls={canExpand ? contentId : undefined}
        aria-label={
          canExpand ? (expanded ? showLessLabel : showMoreLabel) : undefined
        }
      >
        <p
          ref={contentRef}
          id={contentId}
          className={`detail-overview-text text-base leading-8 text-zinc-300 sm:text-lg ${preserveWhitespace ? "whitespace-pre-line" : ""}`}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
          }}
          onTransitionEnd={(event) => {
            if (
              event.propertyName !== "height" ||
              event.target !== event.currentTarget
            )
              return;
            if (expanded) setHeight("auto");
          }}
        >
          {text}
        </p>
        {canExpand && (
          <>
            <span
              className={`detail-overview-fade pointer-events-none absolute inset-x-0 bottom-0 h-20 transition-opacity duration-300 ${expanded ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center"
              aria-hidden
            >
              <ChevronDown
                size={22}
                strokeWidth={2}
                className={`text-zinc-200 drop-shadow-[0_1px_8px_rgba(0,0,0,.65)] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </span>
          </>
        )}
      </div>
    </div>
  );
}
