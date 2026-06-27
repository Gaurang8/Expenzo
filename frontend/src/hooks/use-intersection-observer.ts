import { useEffect, useState, useRef } from "react"

export function useIntersectionObserver(options = {}) {
    const [isIntersecting, setIsIntersecting] = useState(false)
    const [hasIntersected, setHasIntersected] = useState(false)
    const ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting)
            if (entry.isIntersecting) {
                setHasIntersected(true)
            }
        }, options)

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [options])

    return { ref, isIntersecting, hasIntersected }
}
