'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Popover } from '@/components/ui/popover';
import type { ComponentProps } from 'react';

type PopoverProps = ComponentProps<typeof Popover>;

interface HoverClickPopoverProps extends Omit<PopoverProps, 'open' | 'onOpenChange'> {
    children: React.ReactNode;

    // 新增的配置项
    hoverDelay?: number;       // hover 延迟，默认 200ms
    leaveDelay?: number;       // 离开延迟，默认 300ms
    disableHover?: boolean;    // 禁用 hover（移动端可用）

    // 支持受控模式
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
}

/**
 * 增强的 Popover 组件，支持 hover 和 click 双重触发
 * 可以直接替换原有的 Popover 组件，无需修改子组件结构
 */
export function HoverClickPopover({
    children,
    hoverDelay = 200,
    leaveDelay = 300,
    disableHover = false,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    defaultOpen = false,
    ...popoverProps
}: HoverClickPopoverProps) {
    // 内部状态管理
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 判断是否为受控模式
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange || (() => { }) : setInternalOpen;

    // 检测是否为移动设备
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 清理定时器
    const clearTimeouts = useCallback(() => {
        if (enterTimeoutRef.current) {
            clearTimeout(enterTimeoutRef.current);
            enterTimeoutRef.current = null;
        }
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
    }, []);

    // 鼠标进入处理
    const handleMouseEnter = useCallback(() => {
        if (disableHover || isMobile) return;

        clearTimeouts();

        if (hoverDelay > 0) {
            enterTimeoutRef.current = setTimeout(() => {
                setOpen(true);
            }, hoverDelay);
        } else {
            setOpen(true);
        }
    }, [disableHover, isMobile, hoverDelay, setOpen, clearTimeouts]);

    // 鼠标离开处理
    const handleMouseLeave = useCallback(() => {
        if (disableHover || isMobile) return;

        clearTimeouts();

        if (leaveDelay > 0) {
            leaveTimeoutRef.current = setTimeout(() => {
                setOpen(false);
            }, leaveDelay);
        } else {
            setOpen(false);
        }
    }, [disableHover, isMobile, leaveDelay, setOpen, clearTimeouts]);

    // 组件卸载时清理定时器
    useEffect(() => {
        return clearTimeouts;
    }, [clearTimeouts]);

    // 递归处理子组件，给 PopoverTrigger 添加事件处理
    const enhanceChildren = (children: React.ReactNode): React.ReactNode => {
        return React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
                return child;
            }

            // 如果是 PopoverTrigger，添加 hover 事件
            if (child.type && typeof child.type === 'object' && 'displayName' in child.type) {
                const displayName = (child.type as any).displayName;
                if (displayName === 'PopoverTrigger') {
                    const props = child.props as any;
                    return React.cloneElement(child, {
                        ...props,
                        onMouseEnter: (e: React.MouseEvent) => {
                            props.onMouseEnter?.(e);
                            handleMouseEnter();
                        },
                        onMouseLeave: (e: React.MouseEvent) => {
                            props.onMouseLeave?.(e);
                            handleMouseLeave();
                        },
                    });
                }
            }

            // 如果有子组件，递归处理
            const props = child.props as any;
            if (props && props.children) {
                return React.cloneElement(child, {
                    ...props,
                    children: enhanceChildren(props.children),
                });
            }

            return child;
        });
    };

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            {...popoverProps}
        >
            {enhanceChildren(children)}
        </Popover>
    );
}
