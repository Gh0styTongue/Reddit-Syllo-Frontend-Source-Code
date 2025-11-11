interface WonkyRectangleProps {
  color: string;
}

export function WonkyRectangle(props: WonkyRectangleProps) {
  const { color } = props;

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      className="absolute inset-0 block"
      preserveAspectRatio="none"
      fill="none"
    >
      <polygon points="1,0 100,2 99,98 0,100" fill={color} />
    </svg>
  );
}
