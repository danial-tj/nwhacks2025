import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Annotation, SceneDefinition, Source } from "../lib/scenes";

export default function AIPanel({
  scene,
  annotation,
}: {
  scene: SceneDefinition;
  annotation?: Annotation;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const active = useRef<AbortController>();
  useEffect(() => () => active.current?.abort(), []);
  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    const controller = new AbortController();
    active.current?.abort();
    active.current = controller;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    const timer = window.setTimeout(() => controller.abort("timeout"), 20000);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          sceneId: scene.id,
          annotationId: annotation?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "The assistant is unavailable. Try again shortly.",
        );
      if (controller.signal.aborted) return;
      if (
        data.sceneId !== scene.id ||
        (data.annotationId || undefined) !== annotation?.id
      )
        throw new Error("The scene changed. Please ask again.");
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not connect. Please try again.",
        );
      else if (controller.signal.reason === "timeout")
        setError("The request took too long. Please try again.");
    } finally {
      window.clearTimeout(timer);
      if (!controller.signal.aborted || controller.signal.reason === "timeout")
        setLoading(false);
    }
  }
  return (
    <details className="assistantPanel">
      <summary>
        Ask about {scene.label} <span aria-hidden="true">↗</span>
      </summary>
      <div className="assistantContent">
        <p className="assistantContext">
          Exploring {scene.label}
          {annotation ? ` / ${annotation.title}` : ""}
        </p>
        <p className="assistantHint">
          AI explanations use the reference notes. The notes remain available
          when AI is offline.
        </p>
        <div className="promptButtons">
          {scene.prompts.map((prompt) => (
            <button key={prompt} onClick={() => setQuestion(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={ask}>
          <label htmlFor="question">Your question</label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder="What would you like to understand?"
            required
          />
          <button className="askButton" disabled={loading || !question.trim()}>
            {loading ? "Thinking…" : "Ask the guide →"}
          </button>
        </form>
        {error && (
          <p className="errorMessage" role="alert">
            {error}
          </p>
        )}
        <div className="answer" aria-live="polite">
          {answer && (
            <>
              <p>{answer}</p>
              <ul>
                {sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
