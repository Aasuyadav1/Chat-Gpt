import React, { useState, useEffect, useRef } from "react";
import { parse } from "node-html-parser";
import { marked } from "marked";
import { codeToHtml, createCssVariablesTheme, createHighlighter } from "shiki";
import { renderToString } from "react-dom/server";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BiSolidMessageRoundedError } from "react-icons/bi";
import { LuCopy, LuText } from "react-icons/lu";
import { FiLoader } from "react-icons/fi";
import Link from "next/link";
import { CiGlobe } from "react-icons/ci";
// T4 Tag Processor (FIXED VERSION)
export const processSpecificT3Tags = async (
  content: string,
  tagConfigs = {}
) => {
  const root = parse(content);
  // Create highlighter for code processing - FIX: Create once and reuse
  const myTheme = createCssVariablesTheme({
    name: "css-variables",
    variablePrefix: "--shiki-",
    variableDefaults: {
      light: "#24292e",
      dark: "#e1e4e8",
      "light-bg": "#ffffff",
      "dark-bg": "#24292e",
    },
    fontStyle: true,
  });

  let highlighter;
  try {
    highlighter = await createHighlighter({
      langs: [
        "javascript",
        "typescript",
        "mermaid",
        "python",
        "html",
        "css",
        "json",
        "xml",
        "sql",
        "bash",
        "yaml",
        "jsx",
        "tsx",
        "go",
        "rust",
        "java",
      ],
      themes: [myTheme],
    });
  } catch (error) {
    console.error("Failed to create highlighter:", error);
    // Fallback to no highlighting
    highlighter = null;
  }

  const defaultConfigs = {
    "t3-image": (element: any) => {
      const imageUrl = element.textContent.trim();
      const alt = element.getAttribute("alt") || "Generated image";
      return `<img src="${imageUrl}" class="w-[400px] t3-tool-output bg-background rounded-xl border border-input object-cover aspect-square h-auto" alt="${alt}" />`;
    },
    "t3-websearch": (element: any) => {
      const searchedContent = element.innerHTML;
      return `<div class="t3-tool-output bg-background rounded-xl *:p-2">
      <div class="w-full border-b border-input flex items-center gap-2">${renderToString(
        <CiGlobe />
      )} Search Results</div>
      <div>${searchedContent}</div></div>`;
    },
    pre: async (element: any) => {
      // Helper function to escape HTML for fallback
      const escapeHtml = (text: string) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
      };

      // Decode HTML entities
      const htmlDecode = (str: string) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
      };

      // Get the raw HTML content first
      let rawHtml = element.innerHTML;
      let codeContent = "";
      let lang = "javascript";

      // Try to extract language and content from the HTML structure
      const codeMatch = rawHtml.match(
        /<code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>([\s\S]*?)<\/code>/
      );

      if (codeMatch) {
        // Found a code element with language class
        lang = codeMatch[1];
        codeContent = codeMatch[2];
      } else {
        // Check if there's a code element without language class
        const codeElementMatch = rawHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        if (codeElementMatch) {
          codeContent = codeElementMatch[1];
          // Try to get language from pre element
          const preClassAttr = element.getAttribute("class") || "";
          const preLangMatch = preClassAttr.match(/language-(\w+)/);
          lang =
            element.getAttribute("lang") ||
            (preLangMatch ? preLangMatch[1] : "javascript");
        } else {
          // No code element, treat as plain pre content
          codeContent = rawHtml;
          const preClassAttr = element.getAttribute("class") || "";
          const preLangMatch = preClassAttr.match(/language-(\w+)/);
          lang =
            element.getAttribute("lang") ||
            (preLangMatch ? preLangMatch[1] : "javascript");
        }
      }

      // Clean up the content - decode HTML entities
      codeContent = htmlDecode(codeContent.trim());
      const title =
        element.getAttribute("title") ||
        lang.charAt(0).toUpperCase() + lang.slice(1);

      let highlighted = `<pre><code class="language-${lang}">${escapeHtml(
        codeContent
      )}</code></pre>`;

      // Only try to highlight if highlighter is available
      if (typeof highlighter !== "undefined" && highlighter) {
        try {
          highlighted = await highlighter.codeToHtml(codeContent, {
            lang: lang,
            theme: "css-variables",
          });
        } catch (error) {
          console.error(`Error highlighting ${lang}:`, error);
          // Fall back to plain text with proper escaping
          highlighted = `<pre><code class="language-${lang}">${escapeHtml(
            codeContent
          )}</code></pre>`;
        }
      }

      // Create enhanced code block with header and proper data attributes
      return `
    <div class="enhanced-code-block rounded-md overflow-hidden my-4" data-lang="${lang}" data-code="${escapeHtml(
        codeContent
      )}">
      <div class="flex items-center justify-between px-4 py-1 bg-secondary border-b border-border">
        <div class="flex items-center gap-2">
                <span style="font-family: 'consolas', monospace;" class="text-sm font-medium text-foreground">${title}</span>
              </div>
              <div class="flex items-center gap-1">
                       
                          ${renderToString(
                            <Button
                              variant="ghost"
                              size="icon"
                              className="export-btn"
                            >
                              <Download size={16} />
                            </Button>
                          )}
                            ${renderToString(
                              <Button
                                variant="ghost"
                                size="icon"
                                className="wrap-btn"
                              >
                                <LuText size={16} />
                              </Button>
                            )}
                          ${renderToString(
                            <Button
                              variant="ghost"
                              size="icon"
                              className="copy-btn"
                            >
                              <LuCopy size={14} />
                            </Button>
                          )}
                          
                      </div>
      </div>
      <div class="relative code-content !bg-background/60 !border-0 !p-3 !pb-0 !rounded-none !overflow-x-auto">
        ${highlighted.replace(/<pre([^>]*)>/, '<pre$1 class="m-0"')}
      </div>
    </div>
  `;
    },
    "t3-init-tool": (element: any) => {
      const content = element.textContent;

      return `
        <div class="p-3 px-4 bg-background t3-tool-loader w-fit flex items-center gap-2 rounded-xl">${content} ${renderToString(
        <FiLoader className="animate-spin" />
      )}</div>
      `;
    },
    "t3-error": (element: any) => {
      const content = element.textContent;

      return `
        <div class="p-3 !text-white px-4 bg-primary border border-primary/50 t3-tool-loader w-fit flex items-center gap-2 rounded-xl"> ${renderToString(
          <BiSolidMessageRoundedError className="text-2xl" />
        )} ${content}
        ${renderToString(
          <Link href="/settings/subscription" className="!text-white">
            Check Now
          </Link>
        )}
        </div>
      `;
    },
    "t3-gemini": (element: any) => {
      const content = element.textContent;

      return `
        <div class="p-3 !text-white px-4 bg-primary border border-primary/50 t3-tool-loader w-fit flex items-center gap-2 rounded-xl"> ${renderToString(
          <BiSolidMessageRoundedError className="text-2xl" />
        )} ${content}
        ${renderToString(
          <Link href="/connect?service=gemini" className="!text-white">
            Check Now
          </Link>
        )}
        </div>
      `;
    },
  };

  const configs = { ...defaultConfigs, ...tagConfigs };
  const processedTags: any[] = [];

  // Process each configured tag type
  for (const tagName of Object.keys(configs)) {
    const elements = root.querySelectorAll(tagName);

    for (const element of elements) {
      try {
        const replacement = await configs[tagName as keyof typeof configs](
          element
        );
        if (replacement) {
          element.replaceWith(replacement);
          processedTags.push({
            tagName,
            content: element.innerHTML,
            attributes: element.attributes,
          });
        }
      } catch (error) {
        console.error(`Error processing ${tagName}:`, error);
        // Keep original element if processing fails
      }
    }
  }

  // IMPORTANT: Process regular markdown code blocks AFTER T4 tags

  return {
    processedHtml: root.toString(),
    processedTags,
    hasProcessedTags: processedTags.length > 0,
  };
};
