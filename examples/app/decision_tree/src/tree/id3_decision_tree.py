import copy
from queue import Queue
import random
from src.plot.get_data import set_active_attr, modify_new_values


class Node(object):
    ''' Tree node '''
    def __init__(self, parent_name, name, data, children, rem_attr):
        self.parent = parent_name
        self.parentPointer = Node
        self.name = name
        self.data = data
        self.children = children
        self.remainingAttributes = rem_attr
        self.decision = None
        self.value = None
        self.width = 0
        self.coord = (0, 0)

        self.prelim = 0
        self.mod = 0
        self.thread = None
        self.ancestor = self
        self.order_number = 1
        self.change = 0
        self.shift = 0


class DecisionTree(object):
    def __init__(self, data_instance):
        self.attr_names_list = None
        self.attr_dictionary = None
        self.class_attr = None
        self.data_instance = data_instance

    def classify_list(self, attribute_name_var, instances_var):
        ''' Return a list that divide the instances according to the values of a attribute
        For instance, there is a attribute which has values like "low", "med", "high"
        There are 100 instances. For every instances, the attributes values distribute like [30, 40, 30]
        '''
        attribute = self.attr_dictionary[attribute_name_var]
        attribute_index, attribute_values = attribute
        local_distribution = []

        for attributeValue in attribute_values:
            counter = 0
            for instance in instances_var:
                if instance[attribute_index] == attributeValue:
                    counter += 1
            local_distribution.append(counter)

        return local_distribution

    def get_distribution_list(self, attribute_name_var, instances_var):
        ''' Return nested list that divide the instances according to the values of the label
        For instance, there is a attribute which has values like "low", "med", "high"
        There are 100 instances. For every instances, the number of instances distribute like [30, 40, 30]
        For instance, label values are like "un_acc", "acc", "good", "v_good"
        Instances divide according to the label values like [[10, 5, 15, 0], [10, 10, 10, 10], [4, 13, 3, 10]]
        '''
        # build a distribution holder
        attribute = self.attr_dictionary[attribute_name_var]
        attribute_index, attribute_values = attribute
        distribution = []

        # find distribution of class based of values of an attribute
        for attributeValue in attribute_values:
            local_distribution = [0] * len(self.class_attr)

            for instance in instances_var:
                if instance[attribute_index] == attributeValue:
                    class_value = instance[-1]
                    class_index = self.class_attr.index(class_value)
                    local_distribution[class_index] += 1
            distribution.append(local_distribution)

        return distribution

    @staticmethod
    def gini(distribution_list_var):
        ''' Calculate gini value of the node by subtracking sum of proportion of branches from 1 '''
        number_of_instances = sum(distribution_list_var)
        if number_of_instances == 0:
            return 0

        sum_of_squares = 0.0
        for number in distribution_list_var:
            proportion_to_all = float(number)/number_of_instances
            sum_of_squares += proportion_to_all**2
        gini_value = 1 - sum_of_squares
        return gini_value

    def gini_index(self, attribute_name_var, instances_var):
        ''' gini Index of that attribute '''
        distribution_list = self.get_distribution_list(attribute_name_var, instances_var)
        number_of_instances = len(instances_var)

        gini_index_value = 0.0
        for localDistribution in distribution_list:
            number_of_instances_in_local = sum(localDistribution)
            if number_of_instances == 0:
                proportion_to_all = 0
            else:
                proportion_to_all = float(number_of_instances_in_local) / number_of_instances
            gini_value = self.gini(localDistribution)

            element = proportion_to_all * gini_value
            gini_index_value += element

        return gini_index_value

    def choose_the_best(self, attribute_list_var, instances_var):
        ''' Best attribute to divide remaining instances according to the methods value '''
        values_list = []
        for attr in attribute_list_var:
            value = self.gini_index(attr, instances_var)
            values_list.append(value)

        index = values_list.index(min(values_list))
        value = min(values_list)

        return attribute_list_var[index], value

    def distribute_by_attribute(self, attribute_name_var, instances_var):
        ''' Divide instances by values of a attribute '''
        attribute = self.attr_dictionary[attribute_name_var]
        attribute_index, attribute_values = attribute
        distribution = []

        # find distribution of class based of values of an attribute
        for attributeValue in attribute_values:
            local_distribution = []

            for instance in instances_var:
                if instance[attribute_index] == attributeValue:
                    local_distribution.append(instance)
            distribution.append(local_distribution)

        return distribution

    def child_generator(self, node_itself_var):
        ''' Generate children and set them to their parent '''
        parent_name = node_itself_var.name
        instances = node_itself_var.data
        remaining_attributes = node_itself_var.remainingAttributes
        distributed_list = self.distribute_by_attribute(parent_name, instances)

        parent_leaf_check = self.leaf_control(node_itself_var)
        if parent_leaf_check:
            return []

        # never happens, yet for safety concerns
        if instances is []:
            node_itself_var.children = []
            return []

        # generate children
        children = []
        for dataPart in distributed_list:
            child_node = Node(parent_name, "", dataPart, [], [])
            child_node.parentPointer = node_itself_var
            is_leaf = self.leaf_control(child_node)

            if not dataPart:
                child_node = Node(parent_name, "", dataPart, [], [])
                child_node.parentPointer = node_itself_var
                self.determine_dominant_one(child_node)

            elif is_leaf or remaining_attributes == []:
                child_node = Node(parent_name, "", dataPart, [], [])
                child_node.parentPointer = node_itself_var
                self.determine_dominant_one(child_node)

            else:
                children_attr_name, success_value = self.choose_the_best(remaining_attributes, dataPart)
                child_remaining_attr_list = copy.deepcopy(remaining_attributes)
                child_remaining_attr_list.remove(children_attr_name)

                child_node = Node(parent_name, children_attr_name, dataPart, [], child_remaining_attr_list)
                child_node.parentPointer = node_itself_var
                child_node.value = success_value

            children.append(child_node)

        # set children
        node_itself_var.children = children
        return children

    def leaf_control(self, node_var):
        ''' Check if the node's instances distributed to certain value '''
        distributed_list = self.classify_list(self.data_instance.attr_list[-1], node_var.data)
        numbers_greater_than_zero = 0
        for p in distributed_list:
            if p > 0:
                numbers_greater_than_zero += 1

        return numbers_greater_than_zero == 1

    def determine_dominant_one(self, node_var):
        ''' If there is no remaining attribute to divide instances than
            determine the decision by looking remaining instances label values
        '''
        instances = node_var.data
        distributed_list_on_class_attr = self.classify_list(self.data_instance.attr_list[-1], instances)

        max_occurrence = max(distributed_list_on_class_attr)
        max_indexes = [i for i, v in enumerate(distributed_list_on_class_attr) if v == max_occurrence]

        chosen_index = random.choice(max_indexes)
        dominant_class_index = chosen_index
        dominant_class_name = self.class_attr[dominant_class_index]
        node_var.decision = dominant_class_name

    def observe_from_siblings(self, node_var):
        ''' If there is no instance to classify a leaf then choose its decision by checking siblings decisions '''
        siblings = node_var.parentPointer.children
        siblings_distributions = [0] * len(self.class_attr)
        for sibling in siblings:
            sibling_dist = self.classify_list(self.data_instance.attr_list[-1], sibling.data)
            for i in range(len(sibling_dist)):
                siblings_distributions[i] += sibling_dist[i]

        max_index = siblings_distributions.index(max(siblings_distributions))
        max_name = self.class_attr[max_index]
        node_var.decision = max_name

    def tree_distribution(self, attribute_list_var, instances_var, set_root_attribute):
        ''' Set root, start to divide data set and assign children '''
        attrib_list_copy = copy.deepcopy(attribute_list_var)
        instances_copy = copy.deepcopy(instances_var)

        if set_root_attribute == "":
            # this is the root node
            best_attr_name, success_value = self.choose_the_best(attrib_list_copy, instances_copy)
            attrib_list_copy.remove(best_attr_name)
            root_node = Node("", best_attr_name, instances_copy, [], attrib_list_copy)
            root_node.parentPointer = None
            root_node.value = success_value

        else:
            value = self.gini_index(set_root_attribute, instances_var)

            attrib_list_copy.remove(set_root_attribute)
            root_node = Node("", set_root_attribute, instances_copy, [], attrib_list_copy)
            root_node.parentPointer = None
            root_node.value = value

        q = Queue()
        q.put(root_node)
        while not q.empty():
            node = q.get()
            if len(node.data) == 0:
                continue
            child_list = self.child_generator(node)
            for child in child_list:
                if child.decision is not None:
                    continue
                else:
                    q.put(child)

        review_queue = Queue()
        review_queue.put(root_node)
        while not review_queue.empty():

            node = review_queue.get()
            for child in node.children:
                review_queue.put(child)

            # optimize for "noInfo" nodes
            if len(node.data) == 0:
                self.observe_from_siblings(node)

        # observe to prune siblings with same decision
        prune_queue = Queue()
        prune_queue.put(root_node)
        while not prune_queue.empty():

            node = prune_queue.get()
            if not node.decision:
                siblings_decision = ""
                all_leaf_flag = 1
                for child in node.children:
                    if not child.decision:
                        all_leaf_flag = 0
                        prune_queue.put(child)
                    elif all_leaf_flag and child.decision and siblings_decision == "":
                        siblings_decision = child.decision
                    elif all_leaf_flag and child.decision != siblings_decision:
                        all_leaf_flag = 0
                if all_leaf_flag:
                    node.decision = siblings_decision
                    node.name = ""
                    for child in node.children:
                        del child
                        node.children = []

        return root_node

    def make_guess(self, root_node_var, test_instance_var):
        ''' Get test instance decision from tree '''
        flag = True
        node = root_node_var
        decision = ""
        while flag:
            if node.decision is not None:
                decision = node.decision
                break
            if node.decision is None and node.name == "":
                decision = "?"
                break
            attribute = self.attr_dictionary[node.name]
            attribute_index, attribute_values = attribute

            feature_value = test_instance_var[attribute_index]
            feature_index = attribute_values.index(feature_value)

            node = node.children[feature_index]
        return decision

    def real_world_test(self, root_node_var, instances_var):
        ''' Test instances and return the percentage '''
        valid = 0
        invalid = 0
        for ins in instances_var:
            guess = self.make_guess(root_node_var, ins)
            if guess == ins[-1]:
                valid += 1
            else:
                invalid += 1
        return valid/float(valid+invalid)

    def data_set_same(self, tmp_attr_names, attr_names_list):
        ''' Check data set is new '''
        for i in tmp_attr_names:
            if i in attr_names_list and i != self.data_instance.attr_list[-1]:
                return True
        return False

    def generate_tree(self, set_root_attribute, active_attr_list):
        ''' Generate tree '''

        tmp_attr_names = set_active_attr(active_attr_list)
        self.attr_names_list, self.attr_dictionary = \
            copy.deepcopy(self.data_instance.attr_list), copy.deepcopy(self.data_instance.attr_dict)

        if self.data_set_same(tmp_attr_names, self.attr_names_list):
            self.attr_names_list, self.attr_dictionary = modify_new_values(tmp_attr_names,
                                                                           self.attr_names_list,
                                                                           self.attr_dictionary)
        new_att_name_list = copy.deepcopy(self.attr_names_list)
        new_att_name_list.remove(self.data_instance.attr_list[-1])
        percentage = self.data_instance.test_percentage
        test_index = int(len(self.data_instance.data) * percentage / 100)
        self.data_instance.test_percentage = percentage
        if 0 < percentage:
            test_data = self.data_instance.data[:test_index]
            train_data = self.data_instance.data[test_index:]
        else:
            test_data = train_data = self.data_instance.data
        self.class_attr = self.data_instance.attr_values_dict[self.data_instance.attr_list[-1]]
        root_node = self.tree_distribution(new_att_name_list, train_data, set_root_attribute)
        return root_node, self.real_world_test(root_node, test_data)
