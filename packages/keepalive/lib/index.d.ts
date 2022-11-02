import React from 'react';
import type { FC } from 'react';
export declare const KeepAliveContext: React.Context<{
    keepAlive: never[];
    keepElements: {};
}>;
export declare function useKeepOutlets(): JSX.Element;
declare const KeepAliveLayout: FC;
export default KeepAliveLayout;
