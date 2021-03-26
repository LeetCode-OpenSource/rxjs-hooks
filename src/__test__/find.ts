import { ReactTestInstance } from 'react-test-renderer'

export function find(node: ReactTestInstance, type: string): ReactTestInstance {
  return node.find((node) => node.type === type)
}
