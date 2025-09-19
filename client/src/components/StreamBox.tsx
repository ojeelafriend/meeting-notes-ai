import { useLiveStore } from "../stores/liveStore";

export default function StreamBox() {
  const { transcript, summary } = useLiveStore();

  return (
    <div>
      <h1>{transcript?.text}</h1>
      <h1>{summary?.text}</h1>
    </div>
  );
}
