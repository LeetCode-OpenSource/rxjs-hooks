import { ReactTestInstance } from 'react-test-renderer'

export function find(node: ReactTestInstance, type: string) {
  return node.find((node) => node.type === type)
}
