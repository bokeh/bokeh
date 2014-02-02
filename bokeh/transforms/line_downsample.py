import numpy as np
import math

def downsample(domain, data, 
               domain_limit, range_limit, 
               domain_resolution, 
               method='all'
               ):
    """
    axis : 1d numpy array of axis values, of length N
    data : numpy array (2d) of values, (N x M)
    domain_limit : bounds of domain (tuple of length 2)
    range_limit : bounds of range (tuple of length 2)
    domain_resolution : resolution, data will be binned into these quantities
    method : 'all' or 'median' encodes the max/min/median point.  'mean' 
    just encodes the avg
    
    output:
    list of (domain,data) pairs, where they are each 1d vectors
    """
    #sort data
    indexes = np.argsort(domain)
    domain = domain[indexes]
    data = data[indexes,:]
    left_idx = np.searchsorted(domain, domain_limit[0], side='left')
    right_idx = np.searchsorted(domain, domain_limit[1], side='right')
    domain = domain[left_idx:right_idx + 1]
    data = data[left_idx:right_idx + 1, :]
    buckets = (domain - domain.min()) / domain_resolution
    buckets = np.floor(buckets)
    starting_boundaries = np.searchsorted(buckets, 
                                          np.unique(buckets), 
                                          side='left').tolist()
    ending_boundaries = starting_boundaries[1:]
    ending_boundaries.append(None)
    
    datasets = []
    for colidx in range(data.shape[-1]):
        downsampled_domain = []
        downsampled_range = []
        for st, ed in zip(starting_boundaries, ending_boundaries):
            column = data[st:ed, colidx]
            subdomain = domain[st:ed]
            idx = np.argsort(column)
            median_idx = math.floor(len(idx) / 2.)
            min_idx = idx[0]
            max_idx = idx[-1]
            indexes = [min_idx, median_idx, max_idx]
            subdomain = subdomain[indexes]
            column = column[indexes]
            indexes = np.argsort(subdomain)
            subdomain = subdomain[indexes]
            column = column[indexes]
            downsampled_domain.append(subdomain)
            downsampled_range.append(column)
        downsampled_domain = np.concatenate(downsampled_domain)
        downsampled_range = np.concatenate(downsampled_range)
        datasets.append((downsampled_domain, downsampled_range))
    return datasets
            
            
            
    
    

    

