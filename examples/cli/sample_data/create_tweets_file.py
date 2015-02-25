import gzip,time,sys, os, random
here = os.path.dirname(os.path.realpath(__file__))
filepath = os.path.join(here, 'sim_tweets.csv')

header = 'text,lat,lon\n'
with file(filepath, 'w') as f:
    f.write(header)

tweets = []
lons = []
lats = []
# get some saved simulated tweet as base
for i, line in enumerate(gzip.open(os.path.join(here, "simplified_geo_tweets.gz"))):
    if i > 0:
        line = line.strip()
        tweet = line.split(',')
        if len(tweet) == 3:

            tweets.append(tweet)
            lons.append(float(tweet[1]))
            lats.append(float(tweet[2]))
            with file(filepath, 'a') as f:
                f.write("%s\n" % line)
            time.sleep(0.1)

delta = 1
lons = [min(lons)-delta, max(lons)+delta]
lats = [min(lats)-delta, max(lats)+delta]
# start infinite retweets from random locations insite the original tweets area
while True:
    for tweet in tweets:
        tweet[1] = random.uniform(*lons)
        tweet[2] = random.uniform(*lats)
        line = ','.join(str(x) for x in tweet)

        with file(filepath, 'a') as f:
            f.write("%s\n" % line)
        time.sleep(0.1)