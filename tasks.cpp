#include <thread>
#include <vector>
#include <algorithm>
#include "tbb/concurrent_queue.h"
#include "tasks.hpp"

using namespace std;

tbb::concurrent_queue<thread::id> released_threads;
vector<thread> threads;

void Threads::store_thread(thread t) {
    threads.push_back(move(t));
}

void Threads::release_thread(thread::id id) {
    released_threads.push(id);
}

/*
 * Remove all joined threads
 * from the threads vector.
 */
void Threads::remove_joined_threads() {
   threads.erase
        (remove_if(begin(threads),
                   end(threads),
                   [&](const thread &t) {
                       return !t.joinable();
                   }),
         end(threads));
}

/*
 * Join all yet unjoined threads in the threads vector.
 * No need to shrink the vector, since this function
 * is supposed to be called at the end of main.
 */
void Threads::join_all_threads() {
    for (auto &t : threads) {
        if (t.joinable()) {
            t.join();
        }
    }
}

/*
 * Join released threads and clean up the threads vector.
 * Necessary if the threads vector is filling up.
 */
void Threads::join_released_threads() {
    thread::id t_id;
    while(0 < released_threads.unsafe_size()) {
        if (!released_threads.try_pop(t_id)) continue;
        for (auto &t : threads) {
            if ((t_id == t.get_id()) &&
                t.joinable()) {
                t.join();
            }
        }
    }
    remove_joined_threads();
}

Threads::~Threads() {
    join_all_threads();
}

