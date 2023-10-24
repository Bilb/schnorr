import { randomInt } from 'crypto';
import { sampleSize } from 'lodash';

type Share = {
  x: number;
  y: number;
};

function printShares(nodes: Array<Node>) {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    console.log(`\nshares of node at ${index}`);
    node.printShares();
  }
}

class Node {
  private secret: number; // consider that this is the point at x=0
  private secretPolynomial: Array<number>; // first item is x^1, second is x^2, ...
  private shares: Array<Share> = [];
  private quorumSize: number;
  private totalNodesCount: number;
  private ownShare: Share | null = null;

  constructor(totalNodesCount: number, quorumSize: number) {
    this.quorumSize = quorumSize;
    this.totalNodesCount = totalNodesCount;

    const degreeOfPolynomial = quorumSize - 1;

    this.secret = randomInt(1000); // to be changed later, but easier to keep track of what is happening
    this.secretPolynomial = [];
    for (let index = 0; index < degreeOfPolynomial; index++) {
      this.secretPolynomial.push(randomInt(10)); // let's start with a max of 10 for now, easier to read.
    }
  }

  public getShareForNode(node: Node, nodes: Array<Node>): Share {
    if (node === this) {
      throw new Error('this is our private share of the secret');
    }
    const nodeIndex = nodes.findIndex((m) => m === node);

    if (nodeIndex < 0) {
      throw new Error('node not found');
    }
    return this.buildShareForIndex(nodeIndex);
  }

  private buildShareForIndex(nodeIndex: number) {
    // we distribute shares starting at 1 (as 0 is our secret).
    // so if we are the second node (index 1) and are giving a share to node 1 (index 0), we should give him the share at x=1
    const x = nodeIndex + 1;
    if (x <= 0) {
      throw new Error('we cannot build a share based on x=0');
    }
    return {
      y:
        this.secret +
        this.secretPolynomial
          .map((coef, index) => coef * Math.pow(x, index))
          .reduce((previous, current) => previous + current),
      x,
    };
  }

  public setShareFromNode(share: Share) {
    if (this.shares.some((m) => m.x !== share.x)) {
      throw new Error(
        `another share already for x=${share.x} and we should only have the same x value`
      );
    }
    this.shares.push(share);
  }

  public printShares() {
    if (!this.shares.length) {
      console.log(`         not part of quorum as it has no shares`);
      return;
    }
    if (this.shares.length !== this.totalNodesCount - 1) {
      throw new Error(`we should have more shares ${this.shares.length}`);
    }
    for (let index = 0; index < this.shares.length; index++) {
      const share = this.shares[index];
      console.log(`         x=${share.x}: ${share.y}`);
    }
    if (this.ownShare) {
      console.log(`own:     x=${this.ownShare.x}: ${this.ownShare.y}`);
    }
  }

  public buildOwnShare(nodes: Array<Node>) {
    const nodeIndex = nodes.findIndex((m) => m === this);
    if (nodeIndex < 0) {
      throw new Error('node not found for buildOwnShare');
    }
    this.ownShare = this.buildShareForIndex(nodeIndex);
  }
}

/**
 *
 * @param total the number of nodes on the network
 * @param quorumSize the (min) number of nodes we need to sign
 */
function main(total: number, quorumSize: number) {
  const nodes: Array<Node> = [];
  for (let index = 0; index < total; index++) {
    nodes.push(new Node(total, quorumSize));
  }
  // At this point all nodes have a secret and a secret polynomial.
  // Now, we need each of them to generate a share of the secret for each other snodes

  for (let fromIndex = 1; fromIndex <= nodes.length; fromIndex++) {
    for (let forIndex = 1; forIndex <= nodes.length; forIndex++) {
      if (forIndex === fromIndex) {
        continue;
      }
      const fromNode = nodes[fromIndex - 1];
      const forNode = nodes[forIndex - 1];
      const share = fromNode.getShareForNode(forNode, nodes);

      forNode.setShareFromNode(share);
    }
  }

  // printShares(nodes);

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    node.buildOwnShare(nodes);
  }
  printShares(nodes);

  const quorum = sampleSize(nodes, quorumSize);
}

main(10, 7);
