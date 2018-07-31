# -*- coding: utf-8 -*-
#####################################################################################################
# Implementation of "Drawing rooted trees in linear time(Buchheim, Junger and Leipert, 2006)"#

# constant for distance between two nodes
distance = 5


def tree_layout(node):
    ''' main function '''
    first_walk(node)
    second_walk(node, 0-node.mod)


def first_walk(node):
    ''' Calling FIRSTWALK(node) computes a preliminary x-coordinate for node. Before that, FIRSTWALK is
    applied recursively to the children of node, as well as the function APPORTION. After spacing out the
    children by calling EXECUTESHIFTS, the node  is placed to the midpoint of its outermost children.
    '''
    if node.decision:  # if node is a leaf
        node.prelim = 0
        if node.parentPointer and node.parentPointer.children[0] != node:  # if node has a left sibling
            index_node = node.parentPointer.children.index(node)
            node.prelim = node.parentPointer.children[index_node-1].prelim + distance
    else:
        default_ancestor = node.children[0]
        for child in node.children:
            first_walk(child)
            default_ancestor = apportion(child, default_ancestor)

        execute_shifts(node)

        midpoint = (node.children[0].prelim + node.children[-1].prelim)/2

        if node.parentPointer and node.parentPointer.children[0] != node:  # if node has a left sibling
            index_node = node.parentPointer.children.index(node)
            node.prelim = node.parentPointer.children[index_node - 1].prelim + distance
            node.mod = node.prelim - midpoint
        else:
            node.prelim = midpoint


def apportion(node, default_ancestor):
    ''' The procedure APPORTION (again following Walker's notation) is the core of the algorithm. Here a
    new subtree is combined with the previous subtrees. As in the Reingold-Tilford algorithm, threads
    are used to traverse the inside and outside contours of the left and right subtree up to the highest
    common level.
    '''
    if node.parentPointer and node.parentPointer.children[0] != node:
        index_node = node.parentPointer.children.index(node)
        left_sibling = node.parentPointer.children[index_node-1]

        node_in_right = node_out_right = node
        node_in_left = left_sibling
        node_out_left = node_in_right.parentPointer.children[0]
        mod_in_right = node_in_right.mod
        mod_out_right = node_out_right.mod
        mod_in_left = node_in_left.mod
        mod_out_left = node_out_left.mod

        while next_right(node_in_left) and next_left(node_in_right):
            node_in_left = next_right(node_in_left)
            node_in_right = next_left(node_in_right)
            node_out_left = next_left(node_out_left)
            node_out_right = next_right(node_out_right)
            node_out_right.ancestor = node
            shift = (node_in_left.prelim + mod_in_left) - (node_in_right.prelim + mod_in_right) + distance
            if shift > 0:
                move_subtree(ancestor(node_in_left, node, default_ancestor), node, shift)
                mod_in_right = mod_in_right + shift
                mod_out_right = mod_out_right + shift
            mod_in_left = mod_in_left + node_in_left.mod
            mod_in_right = mod_in_right + node_in_right.mod
            mod_out_left = mod_out_left + node_out_left.mod
            mod_out_right = mod_out_right + node_out_right.mod
        if next_right(node_in_left) and next_right(node_out_right) is None:
            node_out_right.thread = next_right(node_in_left)
            node_out_right.mod = node_out_right.mod + mod_in_left - mod_out_right
        if next_left(node_in_right) and next_left(node_out_left) is None:
            node_out_left.thread = next_left(node_in_right)
            node_out_left.mod = node_out_left.mod + mod_in_right - mod_out_left
            default_ancestor = node
    return default_ancestor


def next_left(node):
    ''' It returns the successor of node on this contour.This successor is either given by
    the leftmost child of node or by the thread of node. The function returns None if
    and only if node is on the highest level of its subtree.
    '''
    if node.children:  # if node has a child
        return node.children[0]
    else:
        return node.thread


def next_right(node):
    '''
        The function  works analogously.
    '''
    if node.children:  # if node has a child
        return node.children[-1]
    else:
        return node.thread


def move_subtree(node_left, node_right, shift):
    ''' Shifting a subtree can be done in linear time if performed as explained above. Calling
    MOVESUBTREE(wl,wr,shift) first shifts the current subtree, rooted at wr. This is done by increasing
    prelim(wr) and mod(wr) by shift. All other shifts, applied to the smaller subtrees between wl and wr,
    are performed later by EXECUTESHIFTS. To prepare this, we have to adjust change(wr), shift(wr),
    and change(wl).
    '''
    subtrees = node_right.order_number - node_left.order_number
    shift_subtrees = float(shift) / subtrees
    node_right.change -= shift_subtrees
    node_left.change += shift_subtrees
    node_right.shift += shift
    node_right.prelim += shift
    node_right.mod += shift


def execute_shifts(node):
    ''' The function only needs one traversal of the children of v to
    execute all shifts computed and memorized in MOVESUBTREE.
    '''
    shift = 0
    change = 0
    for child in node.children[::-1]:  # all children from right to left
        child.prelim += shift
        child.mod += shift
        change += child.change
        shift += child.shift + change


def ancestor(node_in_left, node, default_ancestor):
    ''' The function ANCESTOR returns the left one of the greatest
    distinct ancestors of vil and its right neighbor.
    '''
    if node_in_left.ancestor in node.parentPointer.children:  # if the ancestor is a sibling of the node
        return node_in_left.ancestor
    else:
        return default_ancestor


def second_walk(node, m=0):
    ''' The function is used to compute all real x-coordinates
    by summing up the modifiers recursively.
    '''
    node.coord = (node.depth, node.prelim + m + 2)
    for child in node.children:
        second_walk(child, m + node.mod)
