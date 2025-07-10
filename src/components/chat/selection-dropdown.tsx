import React, { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FaWandMagicSparkles } from "react-icons/fa6";
import chatStore from "@/stores/chat.store";
import { FaArrowUp } from "react-icons/fa";
import { Input } from "../ui/input";
import { message } from "antd";
import { toast } from "sonner";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Button } from "../ui/button";
import { updateSelectedText } from "@/action/message.action";
// import userStore from "@/stores/user.store";
import { Portal } from "@radix-ui/react-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FiLoader } from "react-icons/fi";

const PROMPT_TYPES = {
  Longer: "Lengthen",
  Shorter: "Shorten",
  Regenerate: "Regenerate",
  Remove: "Remove",
  Simplify: "Simplify",
  Elaborate: "Elaborate on",
  Formalize: "Make more formal",
  Casual: "Make more casual",
  Persuasive: "Make more persuasive",
  Technical: "Make more technical",
  Metaphor: "Add a metaphor to",
  Examples: "Add examples to",
  Counterargument: "Add a counterargument to",
  Summary: "Summarize",
};

interface Message {
  _id: string;
  userQuery: string;
  aiResponse?: Array<{ content: string; _id: string }>;
  attachment?: string;
}

const TextSelectionDropdown = () => {
  const [selectedText, setSelectedText] = useState("");
  const { messages, setIsRegenerate } = chatStore();
  // const { currentModel, currentService, userData } = userStore();
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [showButton, setShowButton] = useState(false);
  const [subMessageId, setSubMessageId] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [messageId, setMessageId] = useState("");
  const CONTAINER_ID = "text-selection-container";
  const { sendMessage } = useChatStream();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to find nearest parent with data-message-id
  const findNearestMessageContainer = (element: any) => {
    let current = element;
    while (current && current !== document.body) {
      if (
        current.hasAttribute &&
        (current.hasAttribute("data-message-id") ||
          current.hasAttribute("data-sub-message-id"))
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  };

  // Function to check if element or its parents have data-query-id
  const hasQueryId = (element: any) => {
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute && current.hasAttribute("data-query-id")) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  // Function to check if element is an input/textarea or contentEditable
  const isInputElement = (element: any) => {
    if (!element) return false;

    const tagName = element.tagName?.toLowerCase();
    const isFormInput = ["input", "textarea", "select"].includes(tagName);
    const isContentEditable =
      element.contentEditable === "true" ||
      element.getAttribute("contenteditable") === "true";

    // Check parent elements too
    let current = element;
    while (current && current !== document.body) {
      if (
        current.contentEditable === "true" ||
        current.getAttribute("contenteditable") === "true"
      ) {
        return true;
      }
      current = current.parentElement;
    }

    return isFormInput || isContentEditable;
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Get the start container of the selection
        const startContainer = range.startContainer;
        const startElement =
          startContainer.nodeType === Node.TEXT_NODE
            ? startContainer.parentElement
            : startContainer;

        // Skip if selection is within an input element
        if (isInputElement(startElement)) {
          setShowButton(false);
          setSelectedText("");
          setMessageId("");
          return;
        }

        // Check if selection has data-query-id (should not show button)
        if (hasQueryId(startElement)) {
          setShowButton(false);
          setSelectedText("");
          setMessageId("");
          return;
        }

        // Find nearest message container
        const messageContainer = findNearestMessageContainer(startElement);

        if (messageContainer) {
          const messageIdValue =
            messageContainer.getAttribute("data-message-id");
          const subMessageIdValue = messageContainer.getAttribute(
            "data-sub-message-id"
          );

          // Check if selection is within our container
          const container = document.getElementById(CONTAINER_ID);
          const containerRect = container?.getBoundingClientRect();
          if (
            containerRect &&
            rect.left >= containerRect.left &&
            rect.right <= containerRect.right &&
            rect.top >= containerRect.top &&
            rect.bottom <= containerRect.bottom
          ) {
            setSelectedText(text);
            setMessageId(messageIdValue);
            setSubMessageId(subMessageIdValue);
            // Get the exact end position of the selection
            const range = selection.getRangeAt(0);
            const endRange = range.cloneRange();
            endRange.collapse(false); // Collapse to end

            // Create a temporary span to get the exact end position
            const tempSpan = document.createElement("span");
            tempSpan.style.position = "absolute";
            tempSpan.style.visibility = "hidden";
            tempSpan.innerHTML = "|";

            try {
              endRange.insertNode(tempSpan);
              const tempRect = tempSpan.getBoundingClientRect();

              const endX = tempRect.left + window.scrollX;
              const belowY = tempRect.bottom + window.scrollY + 12;

              setButtonPosition({
                x: endX,
                y: belowY,
              });
              setShowButton(true);

              // Clean up the temporary span
              tempSpan.remove();
            } catch (error) {
              // Fallback to original method if insertion fails
              const endX = rect.right + window.scrollX;
              const belowY = rect.bottom + window.scrollY + 12;

              setButtonPosition({
                x: endX,
                y: belowY,
              });
              setShowButton(true);
            }
          }
        } else {
          // No message container found
          setShowButton(false);
          setSelectedText("");
          setMessageId("");
        }
      } else if (!isPopoverOpen) {
        setShowButton(false);
        setSelectedText("");
        setMessageId("");
      }
    };

    const handleClickOutside = (e: any) => {
      // Don't interfere with input/textarea elements
      if (isInputElement(e.target)) {
        return;
      }

      // Don't hide if clicking on the action button or popover content
      if (
        e.target.closest("[data-radix-popper-content-wrapper]") ||
        e.target.closest("button[data-action-button]") ||
        e.target.closest("[data-radix-popover-content]") ||
        e.target.closest(".popover-content")
      ) {
        return;
      }

      // If popover is open, don't clear on outside clicks
      if (isPopoverOpen) {
        return;
      }

      const container = document.getElementById(CONTAINER_ID);
      if (container && !container.contains(e.target)) {
        setShowButton(false);
        setSelectedText("");
        setMessageId("");
        setIsPopoverOpen(false);
        // Only clear selection if it's not in an input element
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const element =
            range.startContainer.nodeType === Node.TEXT_NODE
              ? range.startContainer.parentElement
              : range.startContainer;

          if (!isInputElement(element)) {
            window?.getSelection()?.removeAllRanges();
          }
        }
      }
    };

    // Hide button on scroll
    const handleScroll = () => {
      // Don't clear if popover is open and user is typing
      if (isPopoverOpen && document.activeElement === inputRef.current) {
        return;
      }

      setShowButton(false);
      setIsPopoverOpen(false);
      setSelectedText("");
      setMessageId("");
      window?.getSelection()?.removeAllRanges();
    };

    // Use capture phase for better control
    document.addEventListener("mouseup", handleSelection, true);
    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("click", handleClickOutside, true);
    !isPopoverOpen && document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseup", handleSelection, true);
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("click", handleClickOutside, true);
      !isPopoverOpen &&
        document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isPopoverOpen]); // Add isPopoverOpen to dependency array

  const handleAction = (action: string) => {
    console.log(`${action} action performed on:`, selectedText);
    console.log("Message ID:", messageId);
    setIsPopoverOpen(false);
    setShowButton(false);
    setSelectedText("");
    setMessageId("");
    // Only clear selection if it's not in an input
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer;

      if (!isInputElement(element)) {
        window?.getSelection()?.removeAllRanges();
      }
    }
  };

  const updateMessage = async (action: string) => {
    setIsRegenerate(true);
    setIsProcessing(true);

    const findMessage = messages?.find(
      (message: Message) => message._id === messageId
    );
    const findSubMessage = findMessage?.aiResponse?.find(
      (aiRes: any) => aiRes._id === subMessageId
    );

    console.log("findSubMessage", findSubMessage);
    const attachment = findMessage?.attachment;
    const trimmedQuery = findMessage?.userQuery;

    if (!trimmedQuery?.trim()) {
      setIsProcessing(false);
      return;
    }

    if (!findSubMessage?.content || !selectedText) {
      throw new Error(
        "Missing response content or selected text. Please provide both to proceed."
      );
    }

    const basePrompt = `You are an advanced AI assistant tasked with modifying a specific part of a response while ensuring the entire response remains cohesive, natural, and aligned with its original intent. The original response is: "${findSubMessage.content}". The specific part to modify is: "${selectedText}".`;

    const promptInstructions: { [key: string]: string } = {
      Custom:
        "Apply the custom modification specified in: '${inputRef.current?.value}'.",
      Longer:
        "Expand the content to be more detailed and comprehensive, adding relevant information.",
      Shorter:
        "Condense the content to be more concise while retaining key points.",
      Regenerate:
        "Rewrite the content entirely, maintaining the original meaning and context.",
      Remove: "Remove the content and adjust surrounding text for smooth flow.",
      Simplify: "Rewrite using simpler language for clarity and accessibility.",
      Elaborate: "Add more depth, details, and context to enrich the content.",
      Formalize:
        "Rewrite in a professional, formal tone suitable for official communication.",
      Casual:
        "Rewrite in a relaxed, conversational tone for a friendly audience.",
      Persuasive:
        "Rewrite to be more compelling and convincing, emphasizing key arguments.",
      Technical:
        "Incorporate precise technical details and terminology relevant to the context.",
      Metaphor:
        "Integrate a relevant and vivid metaphor to enhance the content's impact.",
      Examples: "Add clear, relevant examples to illustrate the content.",
      Counterargument:
        "Introduce a balanced counterargument and address it effectively.",
      Summary:
        "Provide a concise summary capturing the essence of the content.",
    };

    const instruction =
      action === "Custom" && inputRef.current?.value
        ? promptInstructions.Custom.replace(
            "${inputRef.current?.value}",
            inputRef.current.value
          )
        : promptInstructions[action] ||
          "Modify as appropriate based on the context.";

    const prompt = `${basePrompt} ${instruction} Ensure the modified part integrates seamlessly with the rest of the response, preserving the original tone, structure, and essential introductory and concluding phrases. Return only the entire modified response without adding non-contextual information or meta-commentary (e.g., avoid phrases like "Here is the changes request").`;

    const promptMessage: any = {
      role: "user",
      content: [
        {
          type: attachment ? "image" : "text",
          mimeType: attachment ? "image/jpeg" : "text/plain",
          text: prompt,
          image: attachment ? new URL(attachment) : undefined,
        },
      ],
    };

    try {
      const response = await sendMessage({
        messages: promptMessage,
        model: "gemini-2.0-flash-exp",
      });
      const generateResponse = await updateSelectedText({
        messageId: findMessage?._id || "",
        subMessageId: findSubMessage?._id || "",
        content: response ? response.trim() : "",
      });

      if (generateResponse.error) {
        toast.error("Failed to regenerate response");
        return;
      }

      if (response?.trim() !== "") {
        chatStore?.setState({
          messages: messages?.map((message: Message) => {
            if (message._id === messageId) {
              return {
                ...message,
                aiResponse:
                  message.aiResponse?.map((aiRes: any) => {
                    // Update the specific AI response that matches the subMessageId
                    if (aiRes._id === subMessageId) {
                      return {
                        ...aiRes,
                        content: response,
                        // Optionally update the model if needed
                        model: aiRes.model,
                      };
                    }
                    return aiRes;
                  }) || [],
              };
            }
            return message;
          }),
        });
      }

      // Clear states after successful update
      handleAction(action);
    } catch (err) {
      console.error("Retry failed:", err);
      // toast.error("Failed to process retry request");
    } finally {
      setIsRegenerate(false);
      setIsProcessing(false);
    }
  };

  return (
    <>
      {showButton && (
        <DropdownMenu
          onOpenChange={(open) => {
            setIsPopoverOpen(open);
            setShowButton(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="fixed z-50 grid place-items-center rounded-full"
              data-action-button="true"
              style={{
                left: `${buttonPosition.x}px`,
                top: `${buttonPosition.y}px`,
                transform: "translateX(0)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsPopoverOpen(!isPopoverOpen);
              }}
            >
              <FaWandMagicSparkles />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={` w-64 rounded-xl p-1 max-h-[300px] overflow-hidden ${
              isProcessing ? "dropdown-loader" : ""
            }`}
            side="bottom"
            align="center"
          >
            <div className="w-full h-full rounded-xl p-1.5 bg-popover">
              <div className="gap-1.5 flex items-center border-b border-input pb-1.5">
                <Input
                  ref={inputRef}
                  className="h-8"
                  placeholder="Enter custom instruction..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      updateMessage("Custom");
                    }
                  }}
                  disabled={isProcessing}
                />
                <Button
                  size="icon"
                  onClick={() => updateMessage("Custom")}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FaArrowUp />
                  )}
                </Button>
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                <p className="text-xs ml-2 font-medium">Quick Actions:</p>
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(PROMPT_TYPES).map(([key, value]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="text-sm text-left justify-start h-7 px-2"
                      onClick={() => updateMessage(key)}
                      disabled={isProcessing}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

export default TextSelectionDropdown;
