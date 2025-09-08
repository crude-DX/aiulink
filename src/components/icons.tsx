import React from 'react';

export const Icons = {
  logo: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      src="/aiulink_icon.png"
      alt="AIULink Logo"
      style={{
        transform: 'scaleX(1.8)', // 가로로 20% 늘리기
        ...props.style
      }}
      {...props}
    />
  ),
};